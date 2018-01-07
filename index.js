require("./logging.js");
const koa = new (require('koa'));
const router = new (require('koa-router'));
const bodyParser = require('koa-bodyparser');
const exec = (require('bluebird')).promisify(require('child_process').exec);
const readFileAsync = (require('bluebird')).promisify(require("fs").readFile);
const crypto = require("crypto");
const constTimeEqual = require("buffer-equal-constant-time");

const secretTokenPromise = readFileAsync("./secret.txt", "utf8").catch(err => {
    console.error("There is no secret.txt file with secret from github webhook");
    process.exit(1);
});
const port = process.argv[3] || 5000;
const allowedRepos = process.argv[2] ? process.argv[2].split(";") : ["test-repo"];
const reposDirectory = process.argv[3] ? process.argv[3] : "~/projects/";

koa.use(async (ctx, next) => {
    try {
        const start = new Date();
        await next();
        const ms = new Date() - start;
        console.log(`${ctx.method} ${ctx.url} from ${ctx.host} took ${ms}ms`);
    } catch (err) {
        console.error('Error', err);
        ctx.status = err.status || 500;
        ctx.body = err.message;
        ctx.app.emit('error', err);
    }
});

router.get('/', async ctx => {
    let body = Object.assign(
        JSON.parse(await readFileAsync("./package.json", "utf8")),
        { watchedRepositories: allowedRepos }
    );
    ctx.body = JSON.stringify(body, null, 4);
});

router.post('/payload', async ctx => {
    let repo = ctx.request.body.repository.name;
    console.log(`${ctx.request.body.sender.login} just pushed to ${repo}`);

    if (allowedRepos.indexOf(repo) === -1 && await verifySignature(ctx.request, secretTokenPromise)) {
        console.error(`${repo} is not allowed`);
    } else {
        await execAsync(`git -C ${reposDirectory}${repo} reset --hard`);
        await execAsync(`git -C ${reposDirectory}${repo} clean -df`);
        await execAsync(`git -C ${reposDirectory}${repo} pull -f`);
        await execAsync(`npm -C ${reposDirectory}${repo} install --production`);
    }
    ctx.status = 200;
});

koa.use(bodyParser());
koa.use(router.routes());
koa.use(router.allowedMethods());

koa.listen(port, () => {
    console.log(`Koa is listening on http://localhost:${port} for pushes to ${allowedRepos.join(", ")} repositories`);
});

async function execAsync(cmd) {
    return exec(cmd).then((err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
    });
}

async function verifySignature(githubRequest, secretTokenPromise) {
    let payloadBody = githubRequest.body;
    let githubHash = githubRequest.headers["HTTP_X_HUB_SIGNATURE"];
    let computedHash = 'sha1=' + crypto.createHmac('sha1', await secretTokenPromise).update(payloadBody).digest('hex');
    return constTimeEqual(githubHash, computedHash);
}
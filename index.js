require("./logging.js");
const koa = new (require('koa'));
const router = new (require('koa-router'));
const exec = (require('bluebird')).promisify(require('child_process').exec);
const readFileAsync = (require('bluebird')).promisify(require("fs").readFile);

const repo = process.argv[2] || "test-repo";
const port = process.argv[3] || 5000;

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
    ctx.body = Object.assign(
        JSON.parse(await readFileAsync("./package.json", "utf8")),
        { repositoryWatched: repo }
    );
    ctx.body = JSON.stringify(ctx.body, null, 4);
});

router.post('/payload', async ctx => {
    console.log(`${ctx.request.body.pusher.name} (${ctx.request.body.pusher.email} just pushed to ${ctx.request.body.repository.name}`);
    await execAsync('git -C ~/projects/wackcoon-device reset --hard');
    await execAsync('git -C ~/projects/wackcoon-device clean -df');
    await execAsync('git -C ~/projects/wackcoon-device pull -f');
    await execAsync('npm -C ~/projects/wackcoon-device install --production');
});

koa.use(router.routes());
koa.use(router.allowedMethods());

koa.listen(port, () => {
    console.log(`Koa is listening on http://localhost:${port} for pushes to ${repo} repository`);
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
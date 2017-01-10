module.exports = {
    apps: [{
        name: "auto-deploy-raspberrypi",
        script: "./index.js",
        args: "home28-raspberrypi 5000",
        node_args: "--harmony-async-await",
        watch: true
    }]
}
module.exports = {
    apps: [{
        name: "auto-deploy-raspberrypi",
        script: "./index.js",
        args: "test123 5001",
        node_args: "--harmony-async-await",
        watch: true
    }]
}
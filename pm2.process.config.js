module.exports = {
    apps: [{
        name: "auto-deploy-raspberrypi",
        script: "./index.js",
        args: "home28-raspberrypi 5000",
        watch: true
    }]
}
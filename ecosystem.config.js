module.exports = {
    apps: [{
        name: "react",
        script: "npm run start"
    },
    {
        name: "server",
        script: "node ./src/services/worker.js"
    }]
}

require('dotenv').config()
const globalTunnel = require('global-tunnel-ng')
const rp = require('request-promise')
const { TaskTimer } = require('tasktimer')


globalTunnel.initialize({ // need the proxy to query the speedcurve API
    host: 'webproxy.merck.com',
    port: 8080,
    proxyAuth: `${process.env.USER}:${process.env.PASS}` // replace with local .env later on
})

const tagName = 'AK Test V1' // insert curent tag configuration name here
const testIds = []
let deployCount = 0
const timer = new TaskTimer(60000) // 60 sec/1 min interval

function runDeploy() {
    console.log(`current deploy count: ${deployCount}`)
    let currentTestId = ''
    const options = {
        method: 'POST',
        uri: 'http://api.speedcurve.com/v1/deploys',
        qs: {
            site_id: '223388',
            url_id: '282026',
            note: encodeURI(tagName)
        },
        auth: {
            user: process.env.API_SECRET,
            pass: 'x'
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true
    };

    rp(options)
        .then(res => { // print some info to the console
            console.log(`--->>> response from speedcurve API: \n${JSON.stringify(res)}\n`)
            console.log(`test ID: ${res.info["tests-added"][0].test}\n`)
            currentTestId = res.info["tests-added"][0].test
            deployCount ++
            console.log(`updated deploy count: ${deployCount}\n`)
            testIds.push(currentTestId)
            console.log(`array of test IDs: ${testIds}\n`)
        })
        .catch(err => {
            console.log(`--->>> error with the current deploy \n${err}`)
        })

}

timer.add([
    {
        id: `${tagName}-${deployCount}`,  
        tickInterval: 12,    // run every 12 min - can change as needed
        totalRuns: 30,   // IMPORTANT: can change this in case you hit any errors to pickup where you left off
        callback(task) {
            // nextstep: if task.totalRuns === 31 then query API based on all testIDs & upload data into local db
            // .then download that as CSV
            runDeploy()
            console.log(`\n--->>> ${task.id} task has run ${task.currentRuns} times.\n`)
        }
    }
])

timer.start()


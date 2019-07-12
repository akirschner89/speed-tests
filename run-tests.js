require('dotenv').config()
const globalTunnel = require('global-tunnel-ng')
const rp = require('request-promise')
const { TaskTimer } = require('tasktimer')


globalTunnel.initialize({ // need the proxy to query the speedcurve API (run tests & get data in the future)
    host: 'webproxy.merck.com',
    port: 8080,
    proxyAuth: `${process.env.USER}:${process.env.PASS}`
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
            deployCount++
            console.log(`updated deploy count: ${deployCount}\n`)
            testIds.push(currentTestId)
            console.log(`array of test IDs: ${testIds}\n`)
        })
        .catch(err => {
            console.log(`--->>> error with the current deploy \n${err}`)
        })

}

function getTestResults(ids) {
    ids.forEach(testId => {
        const options = {
            method: 'GET',
            uri: `http://api.speedcurve.com/v1/tests/${testId}`,
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
            .then(res => {
                const currentTagName = tagName
                const dateTime = res.timestamp
                const backend = res.byte
                const pageLoad = res.dom
                const fullyLoaded = res.loaded
                const timeToInteractive = res.time_to_interactive
                const firstCPUIdle = res.first_cpu_idle
                console.log(`tag name: ${currentTagName}\ntimestamp: ${dateTime}\nbackend: ${backend}\npageload: ${pageLoad}\nfully loaded:${fullyLoaded}\ntime to interactive: ${timeToInteractive}\nfirst CPU Idle: ${firstCPUIdle}`)
            })
            .catch(err => {
                console.log(`--->>> error with fetching data for current test: ${testId} \nerror: ${err}`)
            })
    })
}


timer.add([
    {
        id: `${tagName}-${deployCount}`,
        tickInterval: 3,    // run every 12 min - can change as needed
        totalRuns: 3,   // IMPORTANT: can change this in case you hit any errors to pickup where you left off
        callback(task) {
            // nextstep: if task.totalRuns === 31 then query API by looping through testIds array & upload data into local db
            // .then download that as CSV
            console.log(`\n--->>> ${task.id} task has run ${task.currentRuns} times.\n`)

            if (task.currentRuns === 3) { // add in else if for CSV creation & download
                getTestResults(testIds)
            } else {
                runDeploy()
            }
            // runDeploy()
            // getTestResults(['190712_3G_53e47baaede41d7e0f37ebf9f20396af'])
        }
    }
])


timer.start()
// scripts/test-payments.js
/**
 * Combined Test Suite for Payme and Click Payment Providers
 * Usage:
 *   node scripts/test-payments.js [baseUrl]
 * Example:
 *   node scripts/test-payments.js http://localhost:3000
 */

const { spawn } = require('child_process')
const path = require('path')

const baseUrl = process.argv[2] || 'http://localhost:3000'

function runScript(scriptName) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, scriptName)
    const proc = spawn(process.execPath, [scriptPath, baseUrl], {
      stdio: 'inherit',
      env: process.env,
    })

    proc.on('close', (code) => {
      resolve(code)
    })
  })
}

async function main() {
  console.log('🚀 Running Full Payment Systems Test Suite on:', baseUrl)
  console.log('----------------------------------------------------')
  
  console.log('\n[1/2] RUNNING CLICK INTEGRATION TESTS...')
  await runScript('test-click.js')

  console.log('\n[2/2] RUNNING PAYME INTEGRATION TESTS...')
  await runScript('test-payme.js')

  console.log('\n====================================================')
  console.log('✅ ALL TEST SCRIPTS FINISHED!')
  console.log('====================================================')
}

main()

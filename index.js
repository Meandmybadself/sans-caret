#!/usr/bin/env node --use_strict

const fs = require('fs')
const lockfile = require('@yarnpkg/lockfile')

// Open & parse yarn.lock.
let file = fs.readFileSync('./yarn.lock', 'utf8')
let lockJSON = lockfile.parse(file)

// Make lock package names referencable. Currently, they have their version in the name.
let lockPackages = {}
Object.keys(lockJSON.object).forEach((val) => {
  // Rip the name outta there.
  const match = /(@*[^@]+)/.exec(val)
  const name = match[1]
  // Get the version.
  const version = lockJSON.object[val].version

  // Need to store this in an array because we oftentimes have multiple versions for one package.
  if (!lockPackages[name]) {
    lockPackages[name] = []
  }
  if (!lockPackages[name].includes(version)) {
    lockPackages[name].push(version)
  }
})

let pkg = fs.readFileSync('./package.json', 'utf8')
let pkgJSON = JSON.parse(pkg)

function disambiguate(packageList) {
  Object.keys(packageList).forEach((key) => {
    const val = packageList[key]
    if (val.includes('^') || val.includes('~')) {
      const valSansCaret = val.replace(/[\^|~]/, '')

      // Easy ones.  We only have one version installed.
      if (lockPackages[key] && lockPackages[key].length === 1) {
        packageList[key] = lockPackages[key][0]
      } else if (lockPackages[key].includes(valSansCaret)) {
        packageList[key] = valSansCaret
      } else {
        console.log('Edge case!')
        console.log(key, valSansCaret, lockPackages[key])
      }
    }
  })
}


console.log('Resolving dev dependencies.')
disambiguate(pkgJSON.dependencies)

console.log('Resolving dev dependencies.')
disambiguate(pkgJSON.devDependencies)
//
//
// Object.keys(pkgJSON.devDependencies).forEach((key) => {
//   const val = pkgJSON.devDependencies[key]
//   if (val.includes('^') || val.includes('~')) {
//     const valSansCaret = val.replace(/[\^|~]/, '')
//
//     // Easy ones.  We only have one version installed.
//     if (lockPackages[key] && lockPackages[key].length === 1) {
//       pkgJSON.devDependencies[key] = lockPackages[key][0]
//     } else if (lockPackages[key].includes(valSansCaret)) {
//       pkgJSON.devDependencies[key] = valSansCaret
//     } else {
//       console.log('Edge case!')
//       console.log(key, valSansCaret, lockPackages[key])
//     }
//   }
// })

fs.writeFileSync('./package.json', JSON.stringify(pkgJSON, null, 2), 'utf8')

console.log('Complete. Nuke your node_modules & reinstall.')

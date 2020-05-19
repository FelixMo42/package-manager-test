const ignore = require("ignore")
const crypto = require('crypto')
const uuid = require("uuid").v4
const targz = require('targz')
const fs = require('fs-extra')

let compress = (src, dest, tar) => new Promise((resolve, reject) =>
    targz.compress({src, dest, tar}, err => err ? reject(err) : resolve()))
let decompress = (src, dest) => new Promise((resolve, reject) =>
    targz.decompress({src, dest}, err => err ? reject(err) : resolve()))

let loadIgnoreFile = src => fs.readFile(src).then( (text) => ignore().add(text.toString()) )

let emptyManifest = {
    "builds": [],
    "versions": {}
}

let getManifest = async path => {
    if ( await fs.exists(path) ) {
        return await fs.readJSON(path)
    } else {
        fs.outputJSON(path, emptyManifest)

        return emptyManifest
    }
}

let editManifest = async (bin, op) => {
    let path = `${bin}/manifest.json`

    let manifest = await getManifest(path)

    await op(manifest)

    await fs.outputJSON(path, manifest)
}

let loadShipment = async () => await fs.readJSON("ship.json")

let publish = async bin => {
    let shipment = await loadShipment()

    if (!shipment) {
        console.log("Could not find shipment information!")

        return 1
    }

    if (!shipment.name) {
        console.log("Shipment is missing a name!")

        return 1
    }

    let name = shipment.name

    let ignore = await loadIgnoreFile(`.ignore`)

    let id = uuid()

    let path = `${bin}/${name}`
    
    await fs.ensureDir(path)

    await editManifest(path, manifest => manifest.builds.push(id))

    let targz = `${path}/${id}.tar.gz`

    await compress("./", targz, { ignore: path => ignore.ignores(path) })

    let hash = crypto.createHash('sha512').update(await fs.readFile(targz), "utf8").digest('hex')

    await decompress(targz, "/home/felix/Documents/dez/tmp")

    console.log("Published shipment successfully!")

    return 0
}

module.exports = bin => Promise.all([
    fs.emptyDir("/home/felix/Documents/dez/tmp"),
    fs.emptyDir(bin)
]).then( () => publish(bin) )
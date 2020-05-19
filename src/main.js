const commander = require('commander')
const program = new commander.Command()

const path = "/home/felix/Documents/dez/packages"

require("./deploy")(path)

program.version('0.0.1')

program
    .command('deploy')
    .action(() => require("./deploy")(path))

program
    .command('add')
    .action(() => require("./add")(path))
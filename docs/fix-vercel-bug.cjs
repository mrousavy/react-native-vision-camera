// From: https://github.com/orgs/vercel/discussions/3530#discussioncomment-6752791
module.exports = {
    name: `fix-vercel-bug`,
    factory: (require) => {
      const { Option } = require(`clipanion`)
      const essentials = require("@yarnpkg/plugin-essentials").default
      const idx = essentials.commands.findIndex((c) =>
        c.paths?.flat().includes("add"),
      )
      const AddCommand = essentials.commands[idx]
      const NewAddCommand = class extends AddCommand {
        static paths = AddCommand.paths
        ignored = Option.Boolean(`--ignore-workspace-root-check`, false)
      }
  
      return {
        commands: [NewAddCommand],
      }
    },
  }
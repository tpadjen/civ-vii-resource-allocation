import { name } from '../../mod.config.json' with { type: 'json' }

const patterns = {
    out: [
        {
            file: `${name}.modinfo`,
            search: `${name}\" version=\"{{semver}}\"`,
            replace: `${name}\" version=\"{{versionWithoutPrerelease}}\"`,
        },
        {
            file: `${name}.modinfo`,
            search: '<Version>{{semver}}',
            replace: '<Version>{{versionWithoutPrerelease}}',
        },
    ],
}

// output the patterns array that release-it will use
console.log(JSON.stringify(patterns))

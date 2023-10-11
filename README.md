# Project Fields

A GitHub actions to get and set GitHub project fields.

## Table of Contents

- [Inputs](#inputs)
- [Outputs](#outputs)
- [FAQ](#faq)
  - [Supported field types](#supported-field-types)
  - [Tokens](#tokens)
- [Examples](#examples)
- [Contributors](#contributors-)
- [License](#license)

## Inputs

Here's the complete list of inputs for this action, also available in the [action.yml](action.yml) file.  
For a minimal/typical usage, check out the [examples](#examples) section.

```yml
- uses: EndBug/project-fields@v2
  with:
    # ⬇️ Required inputs ⬇️

    # The type of field operation. Valid options are "get", "set", "clear"
    operation: get

    # A comma-separated list of fields to get or set
    # See the FAQ section for a list of supported field types
    fields: text,number,date,select

    # The GitHub token to use for authentication
    # This token should have write access to the project, and read access
    # to the issue/PR you're referencing (see the FAQ section for more info)
    github_token: ${{ secrets.PROJECT_PAT }}

    # The URL of the project
    project_url: https://github.com/users/OWNER/projects/123

    # ⬇️ Optional inputs ⬇️

    # The URL of the issue/PR to reference
    # Default: the issue/PR that triggered the workflow run
    resource_url: https://github.com/OWNER/REPO/issues/123

    # A comma-separated list of values to update the fields with
    # The list must have the same length as the fields one, since they have to match up
    # Default: ''
    values: abc,123,2000-10-30,option
```

## Outputs

The action provides only one output:

- `values`: a comma-separated list of the current values of the fields

## FAQ

### Supported field types

The action supports the following field data types:

|  Field Type   |   GraphQL Type   |                   Description                   |
| :-----------: | :--------------: | :---------------------------------------------: |
|     Text      | [String][String] |         The literal string in the field         |
|    Number     |  [Float][Float]  |      The string representation of a number      |
|     Date      |   [Date][Date]   |        The date in the YYYY-MM-DD format        |
| Single Select | [String][String] | The name of the option (must be an exact match) |

[String]: https://docs.github.com/en/graphql/reference/scalars#string
[Float]: https://docs.github.com/en/graphql/reference/scalars#float
[Date]: https://docs.github.com/en/graphql/reference/scalars#date

### Tokens

Your token **has to be a classic PAT**: the new fine-grained tokens do not work with the GraphQL API yet.

The token should have the following scopes:

- `repo`: needed read issues and PRs from private repositories. If you're using the action on a public repository, you can just use `public_repo` instead.
- `project`: needed to update project fields. If you're only using the action to get the fields, you can just use `read:project` instead.

## Examples

### Get field values

```yml
on: [issues, pull_request]

# ...

- uses: EndBug/project-fields@v2
  id: fields
  with:
    operation: get
    fields: text,number,date,select
    github_token: ${{ secrets.PROJECT_PAT }}
    project_url: https://github.com/OWNER/REPO/issues/123

- run: echo ${{ steps.fields.outputs.values }}
```

### Update field values

```yml
on: [issues, pull_request]

# ...

- name: Set outputs A and B
  id: script
  run: # ...

- uses: EndBug/project-fields@v2
  with:
    operation: set
    fields: first,second
    github_token: ${{ secrets.PROJECT_PAT }}
    project_url: https://github.com/OWNER/REPO/issues/123
    values: ${{ steps.script.outputs.a }},${{ steps.script.outputs.b }}
```

### Clear fields

```yml
on: [issues, pull_request]

# ...

- uses: EndBug/project-fields@v2
  with:
    operation: clear
    fields: first,second
    github_token: ${{ secrets.PROJECT_PAT }}
    project_url: https://github.com/OWNER/REPO/issues/123
```

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/EndBug"><img src="https://avatars.githubusercontent.com/u/26386270?v=4?s=100" width="100px;" alt="Federico Grandi"/><br /><sub><b>Federico Grandi</b></sub></a><br /><a href="https://github.com/EndBug/project-fields/commits?author=EndBug" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ben-v"><img src="https://avatars.githubusercontent.com/u/8211835?v=4?s=100" width="100px;" alt="Ben"/><br /><sub><b>Ben</b></sub></a><br /><a href="https://github.com/EndBug/project-fields/commits?author=ben-v" title="Code">💻</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

### Additional credits

<table>
  <tr>
    <td align="center" width="200px" height="150px">
      <img width=100 src="https://avatars.githubusercontent.com/u/21289761?&v=4">
    </td>
    <td align="center" width="450px">
      This project has started thanks to the input of the<br><a href="https://githubcampus.expert" style="white-space: nowrap;">GitHub Campus Experts Program 🚩</a>
    </td>
  </tr>
</table>

## License

This project is distributed under the MIT License, check the [license file](LICENSE) for more info.

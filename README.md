# LintGPT

LintGPT scans your code for bugs using AI.

> Status: Alpha ⚡

## Features

- Discover bugs in source code that can be difficult to detect with other tools.
- Automatically fix problems using the `--fix` option.
- Smart caching to only make OpenAI requests for files that have changed.
- Works with many common programming languages.

## Setup

1. Run `npm install lintgpt` to install.
2. Make sure you have an `$OPENAI_API_KEY` environment variable which you can [generate
here](https://beta.openai.com/account/api-keys).

## Example

Below is an example User class in TypeScript. It passes type-checking, and there are no eslint style errors. However, this program still contains a few bugs:

```typescript
export class User {
  constructor (readonly firstName: string, readonly lastName: string, readonly age: number) {
  }

  getFirstName (): string {
    return this.firstName
  }

  getLastName (): string {
    return this.firstName
  }

  getFullName (): string {
    return this.firstName + this.lastName
  }

  isLegalDrinkingAge (): boolean {
    return this.age > 10
  }
}
```

Using `lintgpt` can understand intent and catch logic errors that are difficult to detect with other tools:

```
$ npx lintgpt user.ts

✘ getLastName method returns firstName instead of lastName

    user.ts:10:12
      10 │     return this.firstName
         │            ~~~~~~~~~~~~~~

✘ getFullName method does not include a space between firstName and lastName

    user.ts:14:12
      14 │     return this.firstName + this.lastName
         │            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

✘ isLegalDrinkingAge method checks if age is greater than 10, not the legal drinking age in most countries

    user.ts:18:23
      18 │     return this.age > 10
         │                       ~~

Found 3 problems in user.ts.
```

You can even pass `--fix` to automatically apply suggested changes to your files.

```
$ npx lintgpt user.ts

✔ getLastName method returns firstName instead of lastName

    user.ts:10:12
      10 │     return this.firstName
         │            ~~~~~~~~~~~~~~
    Fixed:
         │     return this.lastName

✔ getFullName method does not include a space between firstName and lastName

    user.ts:14:12
      14 │     return this.firstName + this.lastName
         │            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Fixed:
         │     return this.firstName + ' ' + this.lastName

✔ isLegalDrinkingAge method checks if age is greater than 10, not the legal drinking age in most countries

    user.ts:18:23
      18 │     return this.age > 10
         │                       ~~
    Fixed:
         │     return this.age > 21
```

## Caveats

GPT isn't perfect, and frequently reports things that are not errors, or suggests incorrect fixes. Take care when using the `--fix` option to review any changes.

A good way to think about LintGPT is as a team of highschool interns who just completed their first computer science course. Have them review your code and they might find a few things, but take their output with a grain of salt.

Please also be aware that LintGPT sends the files you pass it to OpenAI. Don't use it in files containing sensitive information.

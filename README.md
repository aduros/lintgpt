# LintGPT

LintGPT scans your code for bugs using AI.

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

Below is a simple User class in TypeScript. It passes type-checking, and there are no eslint style errors. However, this program still contains a few bugs:

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

Using `lintgpt` can catch logic errors that are difficult to detect with other tools:

```
$ npx lintgpt user.ts

✘ getLastName method returns firstName instead of lastName

    problem.ts:10:12
      10 │     return this.firstName
         │            ~~~~~~~~~~~~~~

✘ getFullName method does not include a space between firstName and lastName

    problem.ts:14:12
      14 │     return this.firstName + this.lastName
         │            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

✘ isLegalDrinkingAge method checks if age is greater than 10, not the legal drinking age in most countries

    problem.ts:18:23
      18 │     return this.age > 10
         │                       ~~

Found 3 problems in problem.ts.
```

You can even pass `--fix` to automatically apply suggested changes to your files.

```
$ npx lintgpt user.ts

✔ getLastName method returns firstName instead of lastName

    problem.ts:10:12
      10 │     return this.firstName
         │            ~~~~~~~~~~~~~~
    Fixed:
         │     return this.lastName

✔ getFullName method does not include a space between firstName and lastName

    problem.ts:14:12
      14 │     return this.firstName + this.lastName
         │            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Fixed:
         │     return this.firstName + ' ' + this.lastName

✔ isLegalDrinkingAge method checks if age is greater than 10, not the legal drinking age in most countries

    problem.ts:18:23
      18 │     return this.age > 10
         │                       ~~
    Fixed:
         │     return this.age > 21
```

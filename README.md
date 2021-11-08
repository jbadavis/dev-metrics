# Dev Metrics

This script will calculate the number of merged PRs and average lead time for a given GitHub team over the previous week.

Output will look something like this:

```
Stats for fulfilment
2021-11-01 - 2021-11-05

Number of merged PRs: 6
Average lead time: 248
```

## Installation and Usage

Create a .env and populate the fields with your team name, repository, owner and GitHub personal access token:

[https://github.com/settings/tokens](https://github.com/settings/tokens)

```sh
cp .env.example .env
```

Install and run the script.

```sh
npm i
npm start
```




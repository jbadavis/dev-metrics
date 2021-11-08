import { Octokit } from "@octokit/core";
import dotenv from "dotenv";
import {
  differenceInHours,
  format,
  isFriday,
  previousFriday,
  previousMonday,
  subDays,
} from "date-fns";

dotenv.config();

const teamName = process.env.TEAM_NAME ?? "";
const owner = process.env.OWNER ?? "";
const repo = process.env.REPO ?? "";

const dateFormat = "yyyy-MM-dd";

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

function getDates(): [string, string] {
  const today = new Date();
  const friday = isFriday(today) ? today : previousFriday(today);

  return [
    format(previousMonday(friday), dateFormat),
    format(friday, dateFormat),
  ];
}

async function getTeam(): Promise<string[]> {
  const team: string[] = [];

  const { data } = await octokit.request(
    "GET /orgs/{org}/teams/{team_slug}/members",
    {
      org: owner,
      team_slug: teamName,
    }
  );

  for (const user of data) {
    if (user?.login) {
      team.push(user.login);
    }
  }

  return team;
}

async function getPrFirstCommitTime(
  prNumber: number
): Promise<string | undefined> {
  const commits = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
    {
      owner,
      repo,
      pull_number: prNumber,
    }
  );

  return commits.data[0].commit?.author?.date;
}

(async function getTeamPulls() {
  const [dateFrom, dateTo] = getDates();

  let prs = [];
  let prTimeDiffs = [];

  const team = await getTeam();

  for (const user of team) {
    const res = await octokit.request("GET /search/issues", {
      q: `repo:${owner}/${repo} is:pr author:${user} merged:${dateFrom}..${dateTo}`,
    });

    prs.push(...res.data.items);
  }

  for (const pr of prs) {
    const firstCommitTime = await getPrFirstCommitTime(pr.number);

    if (firstCommitTime) {
      prTimeDiffs.push(
        differenceInHours(new Date(pr.closed_at), new Date(firstCommitTime))
      );
    }
  }

  const averageLeadTime = Math.round(
    prTimeDiffs.reduce((acc, val) => acc + val) / prs.length
  );

  console.log(`Stats for ${teamName}`);
  console.log(`${dateFrom} - ${dateTo}\n`);
  console.log("Number of merged PRs:", prs.length);
  console.log("Average lead time:", averageLeadTime);
})();

#!/usr/bin/env node
import axios from 'axios';
import chalk from 'chalk';
import cheerio from 'cheerio';
import inquirer from 'inquirer';
import fs from 'fs';

const HEADER = " ________            __                                      __                                        __ \n" +
    "/        |          /  |                                    /  |                                      /  |\n" +
    "$$$$$$$$/   ______  $$ |____    ______    ______   _______  $$ |   __   ______       __       _______ $$/ \n" +
    "    /$$/   /      \\ $$      \\  /      \\  /      \\ /       \\ $$ |  /  | /      \\     /  |     /       |/  |\n" +
    "   /$$/    $$$$$$  |$$$$$$$  |/$$$$$$  |/$$$$$$  |$$$$$$$  |$$ |_/$$/  $$$$$$  |    $$/     /$$$$$$$/ $$ |\n" +
    "  /$$/     /    $$ |$$ |  $$ |$$ |  $$/ $$    $$ |$$ |  $$ |$$   $$<   /    $$ |    /  |    $$      \\ $$ |\n" +
    " /$$/____ /$$$$$$$ |$$ |__$$ |$$ |      $$$$$$$$/ $$ |  $$ |$$$$$$  \\ /$$$$$$$ |    $$ | __  $$$$$$  |$$ |\n" +
    "/$$      |$$    $$ |$$    $$/ $$ |      $$       |$$ |  $$ |$$ | $$  |$$    $$ |    $$ |/  |/     $$/ $$ |\n" +
    "$$$$$$$$/  $$$$$$$/ $$$$$$$/  $$/        $$$$$$$/ $$/   $$/ $$/   $$/  $$$$$$$/__   $$ |$$/ $$$$$$$/  $$/ \n" +
    "                                                                              /  \\__$$ |                  \n" +
    "                                                                              $$    $$/                   \n" +
    "                                                                               $$$$$$/                    ";

async function header() {
    console.log(chalk.cyan(HEADER));
    console.log(chalk.cyan("Scrape tabs from zabrenkaj.si"));
    console.log(chalk.yellow("GitHub: \tgithub.com/cgorican"));
    console.log(chalk.yellow("Discord:\tcxg#0510"));
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function scrapePage(scrapeURL) {
    var res = await axios(scrapeURL)
        .catch((err) => {
            if (err)
                console.log(chalk.red("Bad request!"));
        });
    if(res === undefined) {
        console.log(chalk.cyan("Try another link!"));
        await sleep(1500);
        return false;
    }

    const html = res.data;
    const data = parseHTML(html);

    const dirname = 'downloads';

    if (!fs.existsSync(dirname)){
        fs.mkdirSync(dirname);
    }

    var fileName = `${dirname}/${data.author}__${data.title}.tab`;
    fileName = fileName.replaceAll(' ','_');

    try {
        var testFileName = fileName;
        while(fs.existsSync(testFileName)) {
            const extensionIndex = testFileName.lastIndexOf('.')
            const extension = testFileName.substring(extensionIndex, testFileName.length);
            testFileName = testFileName.substring(0, extensionIndex);
            testFileName = `${testFileName}_${Math.floor(Math.random() * 3000)}${extension}`;
        }
        fileName = testFileName;
    } catch(err) {
        console.error(err)
    }
    await fs.writeFileSync(`${fileName}`, data.body);

    console.log(chalk.greenBright("Success!"));
    console.log(chalk.green(`File ${fileName} created.`));
    await sleep(2500);
    return true;
}
function parseHTML(body) {
    var $ = cheerio.load(body);

    const author = $('.song-facts').find('h3').first().text().trim();
    const title = $('.main__title').first().text().trim();
    var songContent = $('#song-content').html().toString().trim();

    songContent = songContent.replaceAll('<br>', '\n');
    songContent = songContent.replaceAll('<br/>', '\n');
    songContent = songContent.replaceAll('{', '[');
    songContent = songContent.replaceAll('}', ']');

    $ = cheerio.load(songContent);
    const result = $.text();

    return {author: author, title: title, body: result};
}
async function handleMenu(option) {
    switch(option) {
        case 'Enter URL': {
            const DOMAIN = "zabrenkaj.si";
            var scrapeURL = await askURL();
            //fix & check URL
            const start = scrapeURL.toLowerCase().indexOf(DOMAIN.toLowerCase());
            if(start !== -1) {
                scrapeURL = scrapeURL.substring(start, scrapeURL.length);
                scrapeURL = `https://${scrapeURL}`;
                await scrapePage(scrapeURL);
            }
            else {
                console.log(chalk.red("Invalid domain - you can only scrape from zabrenkaj.si."))
                await sleep(3000);
            }
            break;
        }
        default: {
            console.log(chalk.magentaBright("Goodbye :)"));
            await sleep(1000);
            console.clear();
            process.exit(0);
            break;
        }
    }
}
async function menu() {
    const answer = await inquirer.prompt({
        name: 'option',
        type: 'list',
        message: 'Choose option:',
        choices: [
            'Enter URL',
            'Exit'
        ]
    });

    return await handleMenu(answer.option);
}
async function askURL() {
    const answer = await inquirer.prompt({
        name: 'scrapeURL',
        type: 'input',
        message: 'Enter song URL:',
        default() {
            return null;
        },
    });

    return answer.scrapeURL;
}

async function main() {
    while(true) {
        await header();
        await menu();
        console.clear();
    }
}

main();
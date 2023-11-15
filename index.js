#!/usr/bin/env node

import { readFile } from "fs";
import https from "https";
import fs from "fs";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import inquirer from "inquirer";
import figlet from "figlet";
import asciify from "asciify-image";
import faker from "faker";
import { format } from "date-fns";
import dotenv from "dotenv";

dotenv.config();

let dateOfInquiry;
let randomDate;
let asciiPath = "";

// async function that displays the CLI app header and description
async function title() {
  const stop = (ms = 2000) =>
    new Promise((resolve) => setTimeout(resolve, 5250));

  figlet(
    "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<  NASCII  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
    function (err, data) {
      if (err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
      }
      console.log(data);

      async function anim() {
        let radar = "";
        setTimeout(() => {
          radar = chalkAnimation.radar(
            "######################################################################################################################################################################",
            12
          );
        }, 2000);
        await stop();
        radar.stop();
      }

      anim();
    }
  );

  // Reads out description
  const promise = new Promise((resolve) => {
    setTimeout(() => {
      readFile("./description.txt", "utf-8", (err, data) => {
        if (err) console.dir(err);
        const result = data;
        resolve(result);
      });
    }, 9000);
  });

  promise.then((data) => {
    console.log("\n", data);
  });

  promise.finally(() => {
    dates();
  });
}

// Async function that deals with the input date prompt
async function dates() {
  let dOI;

  // regex for date
  const regex = /^(0[1-9]|[12][0-1]|3[0-1])-(0[1-9]|1[0-2])-\d{4}$/;

  // inquirer question object
  const question = [
    {
      type: "input",
      name: "date",
      message: "(DD-MM-YYYY): ",
    },
  ];

  // inquirer prompt
  await inquirer.prompt(question).then((answers) => {
    dOI = answers.date;
    dateOfInquiry = dOI;
  });

  // async function that checks every condition for the date entered
  async function dateChecker() {
    if (
      regex.test(dateOfInquiry) &&
      dateOfInquiry !== "" &&
      dateOfInquiry !== "random"
    ) {
      // console.log(dateOfInquiry);

      function isDateInRange(dateOfInquiry) {
        const parts = dateOfInquiry.split('-');
        if (parts.length !== 3) {
          return false; // Date format should be "dd-mm-yyyy"
        }
      
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
      
        // Check if day, month, and year are valid numbers
        if (
          isNaN(day) || isNaN(month) || isNaN(year) ||
          month < 1 || month > 12 || day < 1 || day > 31
        ) {
          return false; // Invalid date components
        }
      
        const inputDate = new Date(year, month - 1, day); // Months are zero-based
        const startDate = new Date(1995, 5, 1); // June is month 5 (zero-based)
        const currentDate = new Date();
      
        if (inputDate >= startDate && inputDate <= currentDate) {
          return true; // Date is within the specified range
        }
      
        return false; // Date is outside the range
      }

      if (isDateInRange(dateOfInquiry)) {
        console.log(chalk.green("Fetching your image")) +
          chalkAnimation.radar(chalk.green("..."));
        getImage();
      } else {
        console.log(chalk.blue("There is no documented APoD for this day."));
        dates();
      }
    } else if (
      !regex.test(dateOfInquiry) &&
      dateOfInquiry.toLowerCase() === "random"
    ) {
      try {
        async function randomDateGenerator(startDateStr, endDateStr) {
          const startDate = new Date(startDateStr);
          const endDate = new Date(endDateStr);
          const randomTimestamp = faker.date.between(startDate, endDate);

          return format(randomTimestamp, "dd-MM-yyyy");
        }

        const startDateStr = "1995-06-01";

        const todaydate = new Date();

        let day = todaydate.getDate();
        let month = todaydate.getMonth() + 1;
        let year = todaydate.getFullYear();

        const endDateStr = `${year}-${month}-${day}`;

        // console.log(endDateStr);

        randomDate = await randomDateGenerator(startDateStr, endDateStr);
        // console.log(randomDate);
      } catch (err) {
        console.dir(err);
      }
      console.log(chalk.green("Fetching your image")) +
        chalkAnimation.radar(chalk.green("........"));
      getImage();
    } else if (dateOfInquiry === "") {
      console.log(chalk.red("Please enter a date.\n"));
      dates();
    } else {
      console.log(chalk.red("Not a valid input!\n"));
      dates();
    }
  }

  await dateChecker();
}

async function getImage() {
  /*   console.log(dateOfInquiry);

  console.log(randomDate);

 */ if (randomDate) {
    let reqDate = randomDate.split("-").reverse().join("-");

    https.get(
      `https://api.nasa.gov/planetary/apod?date=${reqDate}&api_key=${process.env.NASA_API_KEY}`,
      (res) => {
        res
          .on("data", (chunk) => {
            const jsonString = String.fromCharCode.apply(null, chunk);
            const jsonObj = JSON.parse(jsonString);
            const imgURL = jsonObj.url;

            console.log(
              "\n\t\t\t\t\t\t\t\t\t" +
                chalk.bold(jsonObj.title) +
                "\n" +
                jsonObj.date +
                "\n" +
                chalk.italic(jsonObj.explanation)
            );

            console.log(
              chalk.green(
                "\nDownloading the APoD into your current working directory."
              )
            ) + chalkAnimation.radar(chalk.green(".........................."));

            https.get(imgURL, (res) => {
              if (res.statusCode === 200) {
                try {
                  const fileStream = fs.createWriteStream(
                    `${jsonObj.title}_${reqDate}.jpg`
                  );

                  res.on("data", (chunk) => {
                    // Write the received data to the file stream
                    fileStream.write(chunk);
                  });

                  res.on("end", () => {
                    // Close the file stream to finish writing
                    fileStream.end();
                    asciiPath += `${jsonObj.title}_${reqDate}.jpg`;
                    const currentWorkingDirectory = process.cwd();
                    console.log(
                      `Image saved to ${chalk.green(
                        currentWorkingDirectory + "\\" + asciiPath
                      )} `
                    );
                    displayASCIIArt();
                  });
                } catch (err) {
                  console.log(err);
                }
              } else {
                console.log(
                  chalk.red("There was an error fetching your image :( .")
                );
              }
            });
          })
          .on("error", (err) => {
            console.log("Error:" + err.message);
          });
      }
    );
  } else {
    let reqDate = dateOfInquiry.split("-").reverse().join("-");

    https.get(
      `https://api.nasa.gov/planetary/apod?date=${reqDate}&api_key=${process.env.NASA_API_KEY}`,
      (res) => {
        res
          .on("data", (chunk) => {
            const jsonString = String.fromCharCode.apply(null, chunk);
            const jsonObj = JSON.parse(jsonString);
            const imgURL = jsonObj.url;

            console.log(
              "\n\t\t\t\t\t\t\t\t\t" +
                chalk.bold(jsonObj.title) +
                "\n" +
                jsonObj.date +
                "\n" +
                chalk.italic(jsonObj.explanation)
            );

            console.log(
              chalk.green(
                "\nDownloading the APoD into your current working directory."
              )
            ) + chalkAnimation.radar(chalk.green(".........................."));

            https.get(imgURL, (res) => {
              if (res.statusCode === 200) {
                try {
                  const fileStream = fs.createWriteStream(
                    `${jsonObj.title}_${reqDate}.jpg`
                  );

                  res.on("data", (chunk) => {
                    // Write the received data to the file stream
                    fileStream.write(chunk);
                  });

                  res.on("end", () => {
                    // Close the file stream to finish writing
                    fileStream.end();
                    asciiPath += `${jsonObj.title}_${reqDate}.jpg`;
                    const currentWorkingDirectory = process.cwd();
                    console.log(
                      `Image saved to ${chalk.green(
                        currentWorkingDirectory + "\\" + asciiPath
                      )} \n`
                    );
                    displayASCIIArt();
                  });
                } catch (err) {
                  console.log(err);
                }
              } else {
                console.log(
                  chalk.red("There was an error fetching your image :( .")
                );
              }
            });
          })
          .on("error", (err) => {
            console.log("Error:" + err.message);
          });
      }
    );
  }
}

async function displayASCIIArt() {
  const options = {
    fit: "box",
    width: 84,
    height: 84,
  };

  asciify(`${asciiPath}`, options, (err, data) => {
    if (err) console.dir(err);
    console.log("\n", data);
  });
}

title();

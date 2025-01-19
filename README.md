# UA Investment Tax Calculator

UA Investment Tax Calculator is a simple web application built with React. This project demonstrates to students the basics of React development and how to integrate Bootstrap along with Bootswatch themes into a React application.

## Features

### Investment Tax Calculation:

1. In Ukraine, when you buy assets in a foreign currency, you need to consider the exchange rate at both the time of purchase and the time of sale. Taxes are calculated based on the income in Ukrainian Hryvnia (UAH), considering the exchange rate fluctuations.

For example:

- You bought one stock for $10 USD on January 1, 2022, with an exchange rate of 27 UAH/USD.
- You sold the same stock for $11 USD on December 31, 2022, with an exchange rate of 29 UAH/USD.

According to Ukrainian taxation policy, you must pay income tax on the difference in UAH:

- Purchase Value in UAH: 10 USD * 27 UAH/USD = 270 UAH
- Sale Value in UAH: 11 USD * 29 UAH/USD = 319 UAH
- Taxable Income: 319 UAH - 270 UAH = 49 UAH

2. Even if the asset doesn't perform well, you might still have to pay taxes due to currency exchange rate differences. This calculator helps you:

- Estimate Taxes: Calculate the estimated taxes on your investments in UAH.
- Determine "No Loss" Price: Find out the minimum sale price needed to avoid a loss after taxes


## Technology

- React Basics: Understanding components, state, and props.
- Bootstrap Integration: Applying Bootstrap for responsive design and styling.
- Bootswatch Themes: Implementing different themes easily using Bootswatch.

## instalation

1. clone the repo

```bash
git clone https://github.com/rbabyuk-vs/ua-investment-tax-calculator.git
cd ua-investment-tax-calculator
```

2. install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm start
```
The application will open in your default browser at http://localhost:3000.

## License
This project is licensed under the MIT License - see the [LICENSE](https://mit-license.org/) file for details.

# deploy to GitHub Pages

```bash
npm run deploy
```
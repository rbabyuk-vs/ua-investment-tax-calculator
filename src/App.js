import React, { useState } from 'react';
// Import the desired Bootswatch theme
import 'bootswatch/dist/flatly/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const FormComponent = () => {
  const [formData, setFormData] = useState({
    buyDate: '',
    buyPrice: '',
    sellDate: '',
    sellPrice: '',
    calculateNoLossPrice: false,
    taxRateIncome: 18,
    taxRateMilitary: 5
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { buyDate, buyPrice, sellDate, sellPrice, calculateNoLossPrice } = formData;

      // Convert buy date to 'yyyymmdd' format
      const buyDateFormatted = buyDate.replace(/-/g, '');
      const buyApiUrl = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&date=${buyDateFormatted}&json`;
      const buyResponse = await fetch(buyApiUrl);

      if (!buyResponse.ok) {
        throw new Error(`Buy date API error: ${buyResponse.status} ${buyResponse.statusText}`);
      }

      const buyData = await buyResponse.json();

      if (buyData.length === 0) {
        throw new Error('No exchange rate data available for the Buy Date.');
      }

      const buyRate = buyData[0].rate;

      let sellRate;
      let sellRateDate;

      if (calculateNoLossPrice) {
        // Fetch latest exchange rate
        const sellApiUrl = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json`;

        const sellResponse = await fetch(sellApiUrl);

        if (!sellResponse.ok) {
          throw new Error(`Sell date API error: ${sellResponse.status} ${sellResponse.statusText}`);
        }

        const sellData = await sellResponse.json();

        if (sellData.length === 0) {
          throw new Error('No exchange rate data available for the Sell Date.');
        }

        sellRate = sellData[0].rate;
        sellRateDate = sellData[0].exchangedate; // Date of the exchange rate
      } else {
        const sellDateFormatted = sellDate.replace(/-/g, '');

        const sellApiUrl = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&date=${sellDateFormatted}&json`;

        const sellResponse = await fetch(sellApiUrl);

        if (!sellResponse.ok) {
          throw new Error(`Sell date API error: ${sellResponse.status} ${sellResponse.statusText}`);
        }

        const sellData = await sellResponse.json();

        if (sellData.length === 0) {
          throw new Error('No exchange rate data available for the Sell Date.');
        }

        sellRate = sellData[0].rate;
        sellRateDate = sellDate;
      }
      const buyPriceNum = parseFloat(buyPrice);
      const buyPriceUAH = buyRate * buyPriceNum;

      // Tax rates
      const taxRateIncome = formData.taxRateIncome / 100;
      const taxRateMilitary = formData.taxRateMilitary / 100;
      const taxRateComb = taxRateIncome + taxRateMilitary;

      if (calculateNoLossPrice) {
        // Calculate 'No Loss' Sell Price
        /*
        let's solve the equation to get formula for No Loss sell price
        (x * sellRate) - ((x * SellRate - buyPrice * buyRate) * taxRate)) / sellRate = buyPrice
        x * sellRate - ((x * SellRate - buyPrice * buyRate) * taxRate) = buyPrice * sellRate
        x * sellRate - ((x * SellRate - buyPriceUAH) * taxRate) = buyPrice * sellRate
        x * sellRate - (x * taxRate * SellRate - taxRate * buyPriceUAH) = buyPrice * sellRate

        sellRateAfterTax = taxRate * SellRate
        buyPriceUAHAfterTax = taxRate * buyPriceUAH

        x * buyRate - (x * sellRateAfterTax - buyPriceUAHAfterTax) = buyPrice * sellRate
        (x * (buyRate - sellRateAfterTax)) + buyPriceUAHAfterTax = buyPrice * sellRate
        x * (buyRate - sellRateAfterTax) =  buyPrice * sellRate - buyPriceUAHAfterTax
        x = (buyPrice * sellRate - buyPriceUAHAfterTax)/(sellRate - sellRateAfterTax)
        */

        const sellRateAfterTax = taxRateComb * sellRate;
        const buyPriceUAHAfterTax = taxRateComb * buyPriceUAH;

        const sellPriceNoLoss =
          (buyPriceNum * sellRate - buyPriceUAHAfterTax) / (sellRate - sellRateAfterTax);

        const resultData = {
          buyDate: buyDate,
          sellDate: sellRateDate,
          buyRate: buyRate.toFixed(4),
          sellRate: sellRate.toFixed(4),
          buyPriceInUSD: buyPriceNum.toFixed(2),
          sellPriceNoLoss: sellPriceNoLoss.toFixed(2)
        };
        setResults(resultData);

        setIsExpanded(true);
      } else {
        // Convert sell price to number
        const sellPriceNum = parseFloat(sellPrice);

        // Calculate profit/loss
        const profitLoss = sellPriceNum - buyPriceNum;

        // Calculate prices in UAH
        const sellPriceUAH = sellRate * sellPriceNum;
        const profitLossUAH = sellPriceUAH - buyPriceUAH;

        // Initialize tax variables
        let taxUAH = 0;
        let taxUAHIncome = 0;
        let taxUAHMilitary = 0;
        let profitLossAfterTax = profitLoss.toFixed(2);

        if (profitLossUAH > 0) {
          // Calculate taxes
          taxUAHIncome = profitLossUAH * taxRateIncome;
          taxUAHMilitary = profitLossUAH * taxRateMilitary;
          taxUAH = taxUAHIncome + taxUAHMilitary;

          // Convert tax to USD
          const taxUSD = taxUAH / sellRate;

          // Calculate profit after tax
          profitLossAfterTax = (sellPriceNum - buyPriceNum - taxUSD).toFixed(2);
        }

        const resultData = {
          buyDate: buyDate,
          sellDate: sellDate,
          buyRate: buyRate.toFixed(4),
          sellRate: sellRate.toFixed(4),
          buyPriceInUSD: buyPriceNum.toFixed(2),
          sellPriceInUSD: sellPriceNum.toFixed(2),
          profitLoss: profitLoss.toFixed(2),
          taxUAH: taxUAH.toFixed(2),
          taxUAHIncome: taxUAHIncome.toFixed(2),
          taxUAHMilitary: taxUAHMilitary.toFixed(2),
          profitLossAfterTax: profitLossAfterTax,
          taxRateIncome: (taxRateIncome * 100).toFixed(2),
          taxRateMilitary: (taxRateMilitary * 100).toFixed(2),
        };

        setResults(resultData);
        setIsExpanded(true);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`An error occurred: ${error.message}`);
      setResults(null);
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = value;

    if (type === 'checkbox') {
      newValue = checked;
    } else if ((name === 'buyPrice' || name === 'sellPrice') && value !== '') {
      const regex = /^\d*\.?\d*$/;
      if (!regex.test(value)) {
        return;
      }
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: newValue
    }));
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white border-0 pt-4 pb-3">
              <h4 className="card-title text-center mb-0 fw-bold text-primary">Profit Loss Calculator</h4>
            </div>
            <div className="card-header bg-white border-0 pt-4 pb-3">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Tax Rate Income field */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="taxRateIncome" className="form-label fw-semibold">Tax Rate Income (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="taxRateIncome"
                        name="taxRateIncome"
                        value={formData.taxRateIncome}
                        onChange={handleChange}
                        step="0.01"
                        style={{ width: '80px' }}
                      />
                    </div>
                  </div>
                  {/* Tax Rate Military field */}
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="taxRateMilitary" className="form-label fw-semibold">Tax Rate Military (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="taxRateMilitary"
                        name="taxRateMilitary"
                        value={formData.taxRateMilitary}
                        onChange={handleChange}
                        step="0.01"
                        style={{ width: '80px' }}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="card-body px-4 py-4">
              <form onSubmit={handleSubmit}>
                {/* Buy Date and Price */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label htmlFor="buyDate" className="form-label fw-semibold">Buy Date</label>
                    <input
                      type="date"
                      className="form-control form-control-lg border-2"
                      id="buyDate"
                      name="buyDate"
                      value={formData.buyDate}
                      onChange={handleChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      style={{ borderRadius: '8px', fontSize: '1rem', padding: '0.75rem' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="buyPrice" className="form-label fw-semibold">Buy Price (in USD)</label>
                    <input
                      type="text"
                      className="form-control form-control-lg border-2"
                      id="buyPrice"
                      name="buyPrice"
                      value={formData.buyPrice}
                      onChange={handleChange}
                      placeholder="Enter buy price in USD"
                      required
                      style={{ borderRadius: '8px', fontSize: '1rem', padding: '0.75rem' }}
                    />
                  </div>
                </div>

                {/* Checkbox for No Loss Calculation */}
                <div className="form-check mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="calculateNoLossPrice"
                    name="calculateNoLossPrice"
                    checked={formData.calculateNoLossPrice}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="calculateNoLossPrice">
                    Calculate No Loss Price
                  </label>
                </div>

                {/* Sell Date and Price */}
                {!formData.calculateNoLossPrice && (
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label htmlFor="sellDate" className="form-label fw-semibold">Sell Date</label>
                      <input
                        type="date"
                        className="form-control form-control-lg border-2"
                        id="sellDate"
                        name="sellDate"
                        value={formData.sellDate}
                        onChange={handleChange}
                        required
                        min={formData.buyDate}
                        max={new Date().toISOString().split('T')[0]}
                        style={{ borderRadius: '8px', fontSize: '1rem', padding: '0.75rem' }}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="sellPrice" className="form-label fw-semibold">Sell Price (in USD)</label>
                      <input
                        type="text"
                        className="form-control form-control-lg border-2"
                        id="sellPrice"
                        name="sellPrice"
                        value={formData.sellPrice}
                        onChange={handleChange}
                        placeholder="Enter sell price in USD"
                        required
                        style={{ borderRadius: '8px', fontSize: '1rem', padding: '0.75rem' }}
                      />
                    </div>
                  </div>
                )}

                <div className="d-grid gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isLoading}
                    style={{
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : 'Calculate'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Collapsible Results */}
          {results && (
            <div className={`collapse ${isExpanded ? 'show' : ''}`}>
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0 fw-bold text-success">Results</h5>
                  <button
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="card-body px-4 py-4">
                  <div className="table-responsive">
                    <table className="table table-borderless mb-0">
                      <tbody>
                        {formData.calculateNoLossPrice ? (
                          <>
                            <tr>
                              <th scope="row" className="ps-0">Buy Date:</th>
                              <td className="pe-0">{results.buyDate}</td>
                            </tr>
                            <tr>
                              <th scope="row" className="ps-0">Buy Exchange Rate (UAH/USD):</th>
                              <td className="pe-0">{results.buyRate}</td>
                            </tr>
                            <tr>
                              <th scope="row" className="ps-0">Buy Price in USD:</th>
                              <td className="pe-0">{results.buyPriceInUSD}</td>
                            </tr>
                            <tr>
                              <th scope="row" className="ps-0">Sell Date (Rate Used):</th>
                              <td className="pe-0">{results.sellDate}</td>
                            </tr>
                            <tr>
                              <th scope="row" className="ps-0">Sell Exchange Rate (UAH/USD):</th>
                              <td className="pe-0">{results.sellRate}</td>
                            </tr>
                            <tr>
                              <th scope="row" className="ps-0">No Loss Sell Price (USD):</th>
                              <td className="pe-0">{results.sellPriceNoLoss}</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr>
                              <th scope="row" className="ps-0">Total tax in UAH ({results.taxRateIncome}% + {results.taxRateMilitary}%):</th>
                              <td className="pe-0">{results.taxUAH} UAH</td>
                            </tr>
                            <tr>
                              <th scope="row" className="ps-0">Income Tax:</th>
                              <td className="pe-0">{results.taxUAHIncome} UAH</td>
                            </tr>
                            <tr>
                              <th scope="row" className="ps-0">Military Tax:</th>
                              <td className="pe-0">{results.taxUAHMilitary} UAH</td>
                            </tr>
                            <tr>
                              <th scope="row" className="ps-0">Income after taxes (USD):</th>
                              <td className="pe-0">{results.profitLossAfterTax} USD</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Optionally, display a message based on profit or loss */}
                  {!formData.calculateNoLossPrice && (
                    parseFloat(results.profitLossAfterTax) > 0 ? (
                      <div className="alert alert-success mt-4" role="alert">
                        You made a profit of ${results.profitLossAfterTax} USD.
                      </div>
                    ) : parseFloat(results.profitLossAfterTax) < 0 ? (
                      <div className="alert alert-danger mt-4" role="alert">
                        You incurred a loss of ${Math.abs(results.profitLossAfterTax)} USD.
                      </div>
                    ) : (
                      <div className="alert alert-info mt-4" role="alert">
                        You broke even.
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormComponent;

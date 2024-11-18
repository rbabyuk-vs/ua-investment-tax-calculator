import React, { useState } from 'react';
//import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/flatly/bootstrap.min.css'; // npm install bootswatch 
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function isNegative(number) {
  return number < 0;
}

const FormComponent = () => {
  const [formData, setFormData] = useState({
    buyDate: '',
    buyPrice: '',
    sellDate: '',
    sellPrice: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Extract and format dates
      const buyDateFormatted = formData.buyDate.replace(/-/g, '');
      const sellDateFormatted = formData.sellDate.replace(/-/g, '');

      // Build API URLs
      const buyApiUrl = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&date=${buyDateFormatted}&json`;
      const sellApiUrl = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&date=${sellDateFormatted}&json`;

      // Fetch exchange rates
      const [buyResponse, sellResponse] = await Promise.all([
        fetch(buyApiUrl),
        fetch(sellApiUrl)
      ]);

      // Check responses
      if (!buyResponse.ok) {
        throw new Error(`Buy date API error: ${buyResponse.status} ${buyResponse.statusText}`);
      }
      if (!sellResponse.ok) {
        throw new Error(`Sell date API error: ${sellResponse.status} ${sellResponse.statusText}`);
      }

      // Parse JSON data
      const buyData = await buyResponse.json();
      const sellData = await sellResponse.json();

      // Check if data is available
      if (buyData.length === 0) {
        throw new Error('No exchange rate data available for the Buy Date.');
      }
      if (sellData.length === 0) {
        throw new Error('No exchange rate data available for the Sell Date.');
      }

      // Extract exchange rates
      const buyRate = buyData[0].rate;
      const sellRate = sellData[0].rate;
      const profitLoss =  formData.sellPrice - formData.buyPrice;
      const buyPriceUAH = buyData[0].rate * formData.buyPrice;
      const sellPriceUAH = sellData[0].rate * formData.sellPrice;
      const profitLossUAH =  sellPriceUAH - buyPriceUAH;

      // now we caclulate taxes
      const taxRateIncome = 0.18;
      const taxRateMilitary = 0.015;
      const taxRateComp = taxRateIncome + taxRateMilitary;
      let taxUAH = 0;
      let taxUAHIncome = 0;
      let taxUAHMilitary = 0;
      let profitLossAfterTax = profitLoss.toFixed(2);

      if (isNegative(profitLossUAH)) {
        console.log('Loss detected');
      } else {
        console.log('Profit detected');
        taxUAHIncome = profitLossUAH * taxRateIncome;
        taxUAHMilitary = profitLossUAH * taxRateMilitary;
        taxUAH = taxUAHIncome + taxUAHMilitary;
        const taxUSD = taxUAH / sellRate;
        profitLossAfterTax = (formData.sellPrice - formData.buyPrice - taxUSD).toFixed(2);
      }
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
      const sellRateAfterTax = taxRateComp * sellRate
      const buyPriceUAHAfterTax = taxRateComp * buyPriceUAH
      const sellPriceNoLoss = (formData.buyPrice * sellRate - buyPriceUAHAfterTax) / (sellRate - sellRateAfterTax)
      console.log(sellPriceNoLoss)

      const resultData = {
        buyDate: formData.buyDate,
        sellDate: formData.sellDate,
        buyRate,
        sellRate,
        buyPriceInUSD: formData.buyPrice,
        sellPriceInUSD: formData.sellPrice,
        profitLoss: profitLoss.toFixed(2),
        taxUAH: taxUAH.toFixed(2),
        taxUAHIncome: taxUAHIncome.toFixed(2),
        taxUAHMilitary: taxUAHMilitary.toFixed(2),
        profitLossAfterTax: profitLossAfterTax
      };

      setResults(resultData);
      setIsExpanded(true);
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
    const { name, value } = e.target;

    // Ensure only numeric input for prices
    if ((name === 'buyPrice' || name === 'sellPrice') && value !== '') {
      const regex = /^\d*\.?\d*$/;
      if (!regex.test(value)) {
        return;
      }
    }

    setFormData(prevState => ({
      ...prevState,
      [name]: value
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
                      max={formData.sellDate || new Date().toISOString().split('T')[0]}
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

                {/* Sell Date and Price */}
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
                        <tr>
                          <th scope="row" className="ps-0">Total tax in UAH(18% + 1,5%):</th>
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
                      </tbody>
                    </table>
                  </div>
                  {/* Optionally, display a message based on profit or loss */}
                  {parseFloat(results.profitLossAfterTax) > 0 ? (
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

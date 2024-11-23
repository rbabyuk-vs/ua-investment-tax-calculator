import React, { useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/flatly/bootstrap.min.css';

const FormComponent = () => {
  const [formData, setFormData] = useState({
    buyDate: '',
    buyPrice: '',
    sellDate: '',
    sellPrice: '',
    calculateNoLossPrice: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showToast, setShowToast] = useState(false); // State for controlling the toast visibility

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
      const taxRateIncome = 0.18;
      const taxRateMilitary = 0.015;
      const taxRateComp = taxRateIncome + taxRateMilitary;

      if (calculateNoLossPrice) {
        // Calculate 'No Loss' Sell Price
        const sellRateAfterTax = taxRateComp * sellRate;
        const buyPriceUAHAfterTax = taxRateComp * buyPriceUAH;

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
        setShowToast(true); // Show the toast with results
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
          profitLossAfterTax: profitLossAfterTax
        };

        setResults(resultData);
        setShowToast(true); // Show the toast with results
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`An error occurred: ${error.message}`);
      setResults(null);
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

  const handleCloseToast = () => {
    setShowToast(false);
  };

  return (
    <div className="container py-5">
      {/* Form */}
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Form Card */}
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
        </div>
      </div>

      {/* Toast Notification for displaying results */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={handleCloseToast} delay={10000} autohide>
          <Toast.Header>
            <strong className="me-auto">Calculation Results</strong>
          </Toast.Header>
          <Toast.Body>
            {results && (
              <>
                {formData.calculateNoLossPrice ? (
                  <>
                    <h6 className="text-primary">No Loss Sell Price</h6>
                    <p><strong>Buy Date:</strong> {results.buyDate}</p>
                    <p><strong>Buy Exchange Rate (UAH/USD):</strong> {results.buyRate}</p>
                    <p><strong>Buy Price in USD:</strong> {results.buyPriceInUSD}</p>
                    <p><strong>Sell Date (Rate Used):</strong> {results.sellDate}</p>
                    <p><strong>Sell Exchange Rate (UAH/USD):</strong> {results.sellRate}</p>
                    <p><strong>No Loss Sell Price (USD):</strong> {results.sellPriceNoLoss}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Total Tax in UAH (18% + 1.5%):</strong> {results.taxUAH} UAH</p>
                    <p><strong>Income Tax:</strong> {results.taxUAHIncome} UAH</p>
                    <p><strong>Military Tax:</strong> {results.taxUAHMilitary} UAH</p>
                    <p><strong>Income After Taxes (USD):</strong> {results.profitLossAfterTax} USD</p>

                    {/* Optionally, display a message based on profit or loss */}
                    {parseFloat(results.profitLossAfterTax) > 0 ? (
                      <div className="alert alert-success mt-3 mb-0" role="alert">
                        You made a profit of ${results.profitLossAfterTax} USD.
                      </div>
                    ) : parseFloat(results.profitLossAfterTax) < 0 ? (
                      <div className="alert alert-danger mt-3 mb-0" role="alert">
                        You incurred a loss of ${Math.abs(results.profitLossAfterTax)} USD.
                      </div>
                    ) : (
                      <div className="alert alert-info mt-3 mb-0" role="alert">
                        You broke even.
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default FormComponent;

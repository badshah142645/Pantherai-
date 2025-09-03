import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loading, { SkeletonCard, SkeletonTable } from './Loading';
import './Billing.css';

function Billing() {
  const [billingData, setBillingData] = useState({
    currentPlan: null,
    paymentMethods: [],
    billingHistory: [],
    upcomingInvoice: null,
    credits: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/billing', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBillingData(response.data);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/billing/payment-methods', newCard, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCard({ number: '', expiry: '', cvc: '', name: '' });
      setShowAddCard(false);
      fetchBillingData();
    } catch (error) {
      console.error('Failed to add payment method:', error);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/billing/payment-methods/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBillingData();
    } catch (error) {
      console.error('Failed to delete payment method:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="billing">
        <div className="billing-header">
          <h1>Billing & Payments</h1>
        </div>

        <div className="billing-overview">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>

        <div className="billing-sections">
          <div className="billing-section">
            <div className="section-header">
              <h2>Payment Methods</h2>
              <div style={{width: '80px', height: '36px', background: '#333', borderRadius: '6px'}}></div>
            </div>
            <div className="payment-methods">
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="payment-method-card" style={{height: '60px'}}>
                  <Loading type="skeleton" />
                </div>
              ))}
            </div>
          </div>

          <div className="billing-section">
            <h2>Billing History</h2>
            <div className="billing-history">
              <SkeletonTable rows={4} columns={4} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="billing">
      <div className="billing-header">
        <h1>Billing & Payments</h1>
      </div>

      <div className="billing-overview">
        <div className="overview-card">
          <h3>Current Plan</h3>
          <div className="plan-info">
            {billingData.currentPlan ? (
              <>
                <h4>{billingData.currentPlan.name}</h4>
                <p className="plan-price">{formatCurrency(billingData.currentPlan.price)}/month</p>
                <p className="plan-limits">
                  {billingData.currentPlan.requestsLimit} requests/month
                </p>
              </>
            ) : (
              <p className="no-plan">Free Plan</p>
            )}
          </div>
        </div>

        <div className="overview-card">
          <h3>Credits Balance</h3>
          <div className="credits-info">
            <p className="credits-amount">{formatCurrency(billingData.credits)}</p>
            <p className="credits-desc">Available credits</p>
          </div>
        </div>

        {billingData.upcomingInvoice && (
          <div className="overview-card">
            <h3>Next Invoice</h3>
            <div className="invoice-info">
              <p className="invoice-amount">{formatCurrency(billingData.upcomingInvoice.amount)}</p>
              <p className="invoice-date">Due {formatDate(billingData.upcomingInvoice.dueDate)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="billing-sections">
        <div className="billing-section">
          <div className="section-header">
            <h2>Payment Methods</h2>
            <button
              className="btn-primary"
              onClick={() => setShowAddCard(!showAddCard)}
            >
              {showAddCard ? 'Cancel' : 'Add Card'}
            </button>
          </div>

          {showAddCard && (
            <form className="add-card-form" onSubmit={handleAddCard}>
              <div className="form-row">
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={newCard.number}
                    onChange={(e) => setNewCard({...newCard, number: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={newCard.cvc}
                    onChange={(e) => setNewCard({...newCard, cvc: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={newCard.name}
                    onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary">Add Card</button>
            </form>
          )}

          <div className="payment-methods">
            {billingData.paymentMethods.length > 0 ? (
              billingData.paymentMethods.map((method) => (
                <div key={method.id} className="payment-method-card">
                  <div className="card-info">
                    <div className="card-type">•••• •••• •••• {method.last4}</div>
                    <div className="card-details">
                      {method.brand} • Expires {method.expMonth}/{method.expYear}
                    </div>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => handleDeleteCard(method.id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="no-methods">No payment methods added yet.</p>
            )}
          </div>
        </div>

        <div className="billing-section">
          <h2>Billing History</h2>
          <div className="billing-history">
            {billingData.billingHistory.length > 0 ? (
              <div className="history-table">
                <div className="table-header">
                  <span>Date</span>
                  <span>Description</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>
                {billingData.billingHistory.map((invoice) => (
                  <div key={invoice.id} className="table-row">
                    <span>{formatDate(invoice.date)}</span>
                    <span>{invoice.description}</span>
                    <span>{formatCurrency(invoice.amount)}</span>
                    <span className={`status ${invoice.status.toLowerCase()}`}>
                      {invoice.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-history">No billing history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Billing;
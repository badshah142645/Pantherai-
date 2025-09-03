import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loading, { SkeletonCard, SkeletonTable } from './Loading';
import './Usage.css';

function Usage() {
  const [usageData, setUsageData] = useState({
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    dailyUsage: [],
    monthlyUsage: [],
    topModels: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchUsageData();
  }, [timeRange]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/usage?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsageData(response.data);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCost = (cost) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cost);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="usage">
        <div className="usage-header">
          <h1>Usage Statistics</h1>
          <div className="time-range-selector">
            <div className="select" style={{width: '140px', height: '36px'}}></div>
          </div>
        </div>

        <div className="usage-stats-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>

        <div className="usage-charts">
          <div className="chart-section">
            <h2>Daily Usage</h2>
            <div className="chart-placeholder">
              <Loading type="skeleton" />
            </div>
          </div>

          <div className="chart-section">
            <h2>Top Models</h2>
            <div className="chart-placeholder">
              <Loading type="skeleton" />
            </div>
          </div>
        </div>

        <div className="usage-details">
          <h2>Usage Breakdown</h2>
          <SkeletonTable rows={5} columns={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="usage">
      <div className="usage-header">
        <h1>Usage Statistics</h1>
        <div className="time-range-selector">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="select"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="usage-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Requests</h3>
            <p className="stat-value">{formatNumber(usageData.totalRequests)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Total Tokens</h3>
            <p className="stat-value">{formatNumber(usageData.totalTokens)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Cost</h3>
            <p className="stat-value">{formatCost(usageData.totalCost)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Avg Cost/Request</h3>
            <p className="stat-value">
              {usageData.totalRequests > 0
                ? formatCost(usageData.totalCost / usageData.totalRequests)
                : '$0.00'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="usage-charts">
        <div className="chart-section">
          <h2>Daily Usage</h2>
          <div className="chart-placeholder">
            {usageData.dailyUsage.length > 0 ? (
              <div className="daily-usage-list">
                {usageData.dailyUsage.map((day, index) => (
                  <div key={index} className="usage-item">
                    <span className="date">{day.date}</span>
                    <span className="requests">{formatNumber(day.requests)} requests</span>
                    <span className="cost">{formatCost(day.cost)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No usage data available for the selected period.</p>
            )}
          </div>
        </div>

        <div className="chart-section">
          <h2>Top Models</h2>
          <div className="chart-placeholder">
            {usageData.topModels.length > 0 ? (
              <div className="top-models-list">
                {usageData.topModels.map((model, index) => (
                  <div key={index} className="model-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="model-name">{model.name}</span>
                    <span className="usage-count">{formatNumber(model.requests)} requests</span>
                    <span className="model-cost">{formatCost(model.cost)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No model usage data available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="usage-details">
        <h2>Usage Breakdown</h2>
        <div className="details-table">
          <div className="table-header">
            <span>Model</span>
            <span>Requests</span>
            <span>Tokens</span>
            <span>Cost</span>
          </div>
          {usageData.topModels.map((model, index) => (
            <div key={index} className="table-row">
              <span className="model-name">{model.name}</span>
              <span>{formatNumber(model.requests)}</span>
              <span>{formatNumber(model.tokens || 0)}</span>
              <span>{formatCost(model.cost)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Usage;
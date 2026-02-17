import fs from 'fs';

export function generateHTMLReport(summaries, rawData, outputFile) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Network Provider Analysis Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --primary: #1a1a2e;
            --secondary: #16213e;
            --accent: #0f3460;
            --highlight: #e94560;
            --text: #f1f1f1;
            --text-muted: #a8a8a8;
            --card-bg: #1f2937;
            --border: #374151;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: var(--text);
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .container { max-width: 1600px; margin: 0 auto; padding: 20px; }
        
        header {
            text-align: center;
            padding: 40px 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
        }
        
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #fff 0%, var(--highlight) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle { color: var(--text-muted); font-size: 1rem; }
        
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            overflow-x: auto;
            padding: 10px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
        }
        
        .tab {
            padding: 12px 24px;
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            white-space: nowrap;
            font-weight: 500;
        }
        
        .tab:hover { background: var(--accent); border-color: var(--highlight); }
        .tab.active { background: var(--highlight); border-color: var(--highlight); color: white; }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; animation: fadeIn 0.3s; }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(233, 69, 96, 0.2);
        }
        
        .card h2 { font-size: 1.25rem; margin-bottom: 20px; color: var(--highlight); }
        .chart-container { position: relative; height: 300px; }
        
        table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        thead { background: var(--accent); }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border); }
        th {
            font-weight: 600;
            cursor: pointer;
            user-select: none;
            position: relative;
        }
        th:hover { background: var(--secondary); }
        th.sortable::after { content: '⇅'; position: absolute; right: 8px; opacity: 0.3; }
        th.sorted-asc::after { content: '↑'; opacity: 1; }
        th.sorted-desc::after { content: '↓'; opacity: 1; }
        tbody tr { transition: background 0.2s; }
        tbody tr:hover { background: rgba(255, 255, 255, 0.05); cursor: pointer; }
        
        .metric-value { font-weight: 600; color: var(--highlight); }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        .modal.active { display: flex; }
        
        .modal-content {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 30px;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        }
        
        .modal-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: var(--highlight);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
            line-height: 1;
        }
        
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        
        .detail-item { padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; }
        .detail-label { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px; }
        .detail-value { font-size: 1.1rem; font-weight: 600; color: var(--text); }
        
        .raw-data {
            margin-top: 20px;
            padding: 15px;
            background: var(--primary);
            border-radius: 8px;
            font-size: 0.85rem;
            max-height: 300px;
            overflow-y: auto;
        }
        .raw-data h3 { color: var(--highlight); margin-bottom: 10px; }
        .raw-data-item {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border);
        }
        .raw-data-label { color: var(--text-muted); font-weight: 600; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-card { background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 2rem; font-weight: 700; color: var(--highlight); }
        .stat-label { font-size: 0.9rem; color: var(--text-muted); margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📊 Network Provider Analysis Report</h1>
            <p class="subtitle">Comprehensive comparison of ${summaries.length} network service providers</p>
        </header>
        
        <div class="tabs">
            <div class="tab active" onclick="switchTab('overview')">📈 Overview</div>
            <div class="tab" onclick="switchTab('financial')">💰 Financial</div>
            <div class="tab" onclick="switchTab('customers')">👥 Customers</div>
            <div class="tab" onclick="switchTab('tm-forum')">🎯 TM Forum</div>
            <div class="tab" onclick="switchTab('news')">📰 News</div>
            <div class="tab" onclick="switchTab('data-table')">📋 Data Table</div>
        </div>
        
        <div id="overview" class="tab-content active">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${summaries.length}</div>
                    <div class="stat-label">Total Carriers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${new Set(summaries.map(s => s['Primary Country'])).size}</div>
                    <div class="stat-label">Countries</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${summaries.filter(s => parseFloat(s['TM Forum Sponsorship Score']) >= 75).length}</div>
                    <div class="stat-label">Top-Tier Partners</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${summaries.filter(s => parseFloat(s['News Sentiment Score']) > 0).length}</div>
                    <div class="stat-label">Positive Sentiment</div>
                </div>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h2>Coverage vs Sentiment Matrix</h2>
                    <p style="font-size:0.78rem; color: var(--text-muted); margin-bottom: 12px;">X = Article Count &nbsp;|&nbsp; Y = Sentiment Score (-10 to +10)</p>
                    <div class="chart-container"><canvas id="overviewNewsMatrixChart"></canvas></div>
                </div>
                <div class="card">
                    <h2>Market Cap vs Revenue</h2>
                    <div class="chart-container"><canvas id="marketCapChart"></canvas></div>
                </div>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h2>Geographic Distribution</h2>
                    <div class="chart-container"><canvas id="geoChart"></canvas></div>
                </div>
                <div class="card">
                    <h2>TM Forum Engagement</h2>
                    <p style="font-size:0.78rem; color: var(--text-muted); margin-bottom: 12px;">Bubble size = Sponsorship level &nbsp;|&nbsp; Color = White Papers volume</p>
                    <div class="chart-container"><canvas id="engagementChart"></canvas></div>
                </div>
            </div>
        </div>
        
        <div id="financial" class="tab-content">
            <div class="grid">
                <div class="card">
                    <h2>Revenue Comparison</h2>
                    <div class="chart-container"><canvas id="revenueBarChart"></canvas></div>
                </div>
                <div class="card">
                    <h2>Market Capitalization</h2>
                    <div class="chart-container"><canvas id="marketCapBarChart"></canvas></div>
                </div>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h2>Stock Performance YoY</h2>
                    <div class="chart-container"><canvas id="stockChart"></canvas></div>
                </div>
                <div class="card">
                    <h2>TAM Market Share</h2>
                    <div class="chart-container"><canvas id="tamChart"></canvas></div>
                </div>
            </div>
        </div>
        
        <div id="customers" class="tab-content">
            <div class="grid">
                <div class="card">
                    <h2>Customer Segmentation</h2>
                    <div class="chart-container"><canvas id="customerSegmentChart"></canvas></div>
                </div>
                <div class="card">
                    <h2>Mobile Subscribers</h2>
                    <div class="chart-container"><canvas id="mobileChart"></canvas></div>
                </div>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h2>Broadband Subscribers</h2>
                    <div class="chart-container"><canvas id="broadbandChart"></canvas></div>
                </div>
                <div class="card">
                    <h2>Enterprise Customers</h2>
                    <div class="chart-container"><canvas id="enterpriseChart"></canvas></div>
                </div>
            </div>
        </div>
        
        <div id="tm-forum" class="tab-content">
            <div class="grid">
                <div class="card">
                    <h2>Sponsorship Scores</h2>
                    <div class="chart-container"><canvas id="sponsorshipChart"></canvas></div>
                </div>
                <div class="card">
                    <h2>Speaker Participation</h2>
                    <div class="chart-container"><canvas id="speakersChart"></canvas></div>
                </div>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h2>Catalyst Projects</h2>
                    <div class="chart-container"><canvas id="catalystChart"></canvas></div>
                </div>
                <div class="card">
                    <h2>White Papers Published</h2>
                    <div class="chart-container"><canvas id="whitePapersChart"></canvas></div>
                </div>
            </div>
        </div>
        
        <div id="news" class="tab-content">
            <div class="grid">
                <div class="card">
                    <h2>News Coverage Volume</h2>
                    <div class="chart-container"><canvas id="newsCountChart"></canvas></div>
                </div>
                <div class="card">
                    <h2>Sentiment Analysis</h2>
                    <div class="chart-container"><canvas id="sentimentChart"></canvas></div>
                </div>
            </div>
            
            <div class="card">
                <h2>Coverage vs Sentiment Matrix</h2>
                <div class="chart-container"><canvas id="newsMatrixChart"></canvas></div>
            </div>
        </div>
        
        <div id="data-table" class="tab-content">
            <div class="card">
                <h2>Complete Dataset (Click row for details)</h2>
                <div style="overflow-x: auto;">
                    <table id="dataTable">
                        <thead>
                            <tr>
                                <th class="sortable" onclick="sortTable(0)">Company</th>
                                <th class="sortable" onclick="sortTable(1)">Country</th>
                                <th class="sortable" onclick="sortTable(2)">Revenue ($B)</th>
                                <th class="sortable" onclick="sortTable(3)">Market Cap ($B)</th>
                                <th class="sortable" onclick="sortTable(4)">Sponsorship</th>
                                <th class="sortable" onclick="sortTable(5)">Speakers</th>
                                <th class="sortable" onclick="sortTable(6)">Sentiment</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${summaries.map((s, i) => `
                                <tr onclick="showDetails(${i})">
                                    <td><strong>${s['Company Name']}</strong></td>
                                    <td>${s['Primary Country']}</td>
                                    <td class="metric-value">${s['Carrier Revenue ($B)']}</td>
                                    <td class="metric-value">${s['Market Cap ($B)']}</td>
                                    <td class="metric-value">${s['TM Forum Sponsorship Score']}</td>
                                    <td class="metric-value">${s['TM Forum Speakers']}</td>
                                    <td class="metric-value ${parseFloat(s['News Sentiment Score']) > 0 ? 'positive' : parseFloat(s['News Sentiment Score']) < 0 ? 'negative' : ''}">${s['News Sentiment Score']}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <div id="detailModal" class="modal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">×</button>
            <div id="modalBody"></div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
        const summaryData = ${JSON.stringify(summaries)};
        const rawData = ${JSON.stringify(rawData)};
        
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }
        
        const colors = ['#e94560', '#0f3460', '#16213e', '#533483', '#f07167', '#00d4aa', '#fca311', '#14213d', '#6a994e', '#bc4749'];
        const chartDefaults = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#f1f1f1' }}},
            scales: {
                x: { ticks: { color: '#a8a8a8' }, grid: { color: '#374151' }},
                y: { ticks: { color: '#a8a8a8' }, grid: { color: '#374151' }}
            }
        };
        
        function getNum(val) { const num = parseFloat(val); return isNaN(num) ? 0 : num; }
        
        // Overview: Coverage vs Sentiment Matrix
        new Chart(document.getElementById('overviewNewsMatrixChart'), {
            type: 'scatter',
            data: {
                datasets: summaryData.map((s, i) => ({
                    label: s['Company Name'],
                    data: [{
                        x: getNum(s['News Article Count']),
                        y: getNum(s['News Sentiment Score']),
                    }],
                    backgroundColor: getNum(s['News Sentiment Score']) >= 0 ? '#10b981cc' : '#ef4444cc',
                    borderColor: getNum(s['News Sentiment Score']) >= 0 ? '#10b981' : '#ef4444',
                    borderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 11,
                }))
            },
            options: {
                ...chartDefaults,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const s = summaryData[context.datasetIndex];
                                return [
                                    s['Company Name'],
                                    'Articles: ' + context.raw.x,
                                    'Sentiment: ' + (context.raw.y > 0 ? '+' : '') + context.raw.y
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Article Count', color: '#a8a8a8' },
                        ticks: { color: '#a8a8a8' },
                        grid: { color: '#374151' }
                    },
                    y: {
                        title: { display: true, text: 'Sentiment Score', color: '#a8a8a8' },
                        ticks: { color: '#a8a8a8' },
                        grid: {
                            color: (ctx) => ctx.tick.value === 0 ? '#e9456066' : '#374151'
                        }
                    }
                }
            }
        });
        
        new Chart(document.getElementById('marketCapChart'), {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Carriers',
                    data: summaryData.map(s => ({ x: getNum(s['Carrier Revenue ($B)']), y: getNum(s['Market Cap ($B)']), company: s['Company Name'] })),
                    backgroundColor: '#e94560'
                }]
            },
            options: { ...chartDefaults, plugins: { tooltip: { callbacks: { label: (context) => context.raw.company + ': Revenue $' + context.raw.x + 'B, Market Cap $' + context.raw.y + 'B' }}}}
        });
        
        const countries = {};
        summaryData.forEach(s => { const country = s['Primary Country']; countries[country] = (countries[country] || 0) + 1; });
        new Chart(document.getElementById('geoChart'), {
            type: 'doughnut',
            data: { labels: Object.keys(countries), datasets: [{ data: Object.values(countries), backgroundColor: colors }]},
            options: { ...chartDefaults, plugins: { legend: { position: 'right', labels: { color: '#a8a8a8' }}}}
        });
        
        // TM Forum Engagement Bubble Chart
        // Bubble size = Sponsorship Score, Color = White Papers count
        const maxWhitePapers = Math.max(...summaryData.map(s => getNum(s['White Papers'])), 1);
        
        function whitePapersColor(count) {
            const ratio = count / maxWhitePapers;
            if (ratio >= 0.75) return '#00d4aa';
            if (ratio >= 0.50) return '#fca311';
            if (ratio >= 0.25) return '#e94560';
            return '#533483';
        }
        
        new Chart(document.getElementById('engagementChart'), {
            type: 'bubble',
            data: {
                datasets: summaryData.map((s, i) => ({
                    label: s['Company Name'],
                    data: [{
                        x: getNum(s['Catalyst Projects']),
                        y: getNum(s['TM Forum Speakers']),
                        r: Math.max(6, getNum(s['TM Forum Sponsorship Score']) / 8),
                    }],
                    backgroundColor: whitePapersColor(getNum(s['White Papers'])) + 'cc',
                    borderColor: whitePapersColor(getNum(s['White Papers'])),
                    borderWidth: 2,
                    whitepapers: getNum(s['White Papers'])
                }))
            },
            options: {
                ...chartDefaults,
                plugins: {
                    legend: { 
                        display: true,
                        labels: { 
                            color: '#a8a8a8',
                            generateLabels: () => [
                                { text: 'White Papers: High (75-100%)', fillStyle: '#00d4aa', strokeStyle: '#00d4aa', lineWidth: 2, fontColor: '#a8a8a8' },
                                { text: 'White Papers: Medium (50-75%)', fillStyle: '#fca311', strokeStyle: '#fca311', lineWidth: 2, fontColor: '#a8a8a8' },
                                { text: 'White Papers: Low (25-50%)',  fillStyle: '#e94560', strokeStyle: '#e94560', lineWidth: 2, fontColor: '#a8a8a8' },
                                { text: 'White Papers: Minimal (0-25%)', fillStyle: '#533483', strokeStyle: '#533483', lineWidth: 2, fontColor: '#a8a8a8' },
                            ]
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const s = summaryData[context.datasetIndex];
                                return [
                                    s['Company Name'],
                                    'Catalysts: ' + getNum(s['Catalyst Projects']),
                                    'Speakers: ' + getNum(s['TM Forum Speakers']),
                                    'Sponsorship: ' + getNum(s['TM Forum Sponsorship Score']),
                                    'White Papers: ' + getNum(s['White Papers'])
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Catalyst Projects', color: '#a8a8a8' },
                        ticks: { color: '#a8a8a8' },
                        grid: { color: '#374151' }
                    },
                    y: {
                        title: { display: true, text: 'Speakers', color: '#a8a8a8' },
                        ticks: { color: '#a8a8a8' },
                        grid: { color: '#374151' }
                    }
                }
            }
        });
        
        // Financial Charts
        new Chart(document.getElementById('revenueBarChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Revenue ($B)', data: summaryData.map(s => getNum(s['Carrier Revenue ($B)'])), backgroundColor: '#e94560' }]}, options: chartDefaults });
        new Chart(document.getElementById('marketCapBarChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Market Cap ($B)', data: summaryData.map(s => getNum(s['Market Cap ($B)'])), backgroundColor: '#0f3460' }]}, options: chartDefaults });
        new Chart(document.getElementById('stockChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Stock Change YoY (%)', data: summaryData.map(s => getNum(s['Stock Change YoY (%)'])), backgroundColor: summaryData.map(s => getNum(s['Stock Change YoY (%)']) >= 0 ? '#10b981' : '#ef4444') }]}, options: chartDefaults });
        new Chart(document.getElementById('tamChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'TAM %', data: summaryData.map(s => getNum(s['TAM (%)'])), backgroundColor: '#533483' }]}, options: chartDefaults });
        
        // Customer Charts
        new Chart(document.getElementById('customerSegmentChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Mobile (M)', data: summaryData.map(s => getNum(s['Customers - Mobile (M)'])), backgroundColor: '#e94560' }, { label: 'Broadband (M)', data: summaryData.map(s => getNum(s['Customers - Broadband (M)'])), backgroundColor: '#0f3460' }, { label: 'Enterprise (M)', data: summaryData.map(s => getNum(s['Customers - Enterprise (M)'])), backgroundColor: '#00d4aa' }]}, options: { ...chartDefaults, scales: { x: { ...chartDefaults.scales.x, stacked: true }, y: { ...chartDefaults.scales.y, stacked: true }}}});
        new Chart(document.getElementById('mobileChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Mobile Subscribers (M)', data: summaryData.map(s => getNum(s['Customers - Mobile (M)'])), backgroundColor: '#e94560' }]}, options: chartDefaults });
        new Chart(document.getElementById('broadbandChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Broadband Subscribers (M)', data: summaryData.map(s => getNum(s['Customers - Broadband (M)'])), backgroundColor: '#0f3460' }]}, options: chartDefaults });
        new Chart(document.getElementById('enterpriseChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Enterprise Customers (M)', data: summaryData.map(s => getNum(s['Customers - Enterprise (M)'])), backgroundColor: '#00d4aa' }]}, options: chartDefaults });
        
        // TM Forum Charts
        new Chart(document.getElementById('sponsorshipChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Sponsorship Score', data: summaryData.map(s => getNum(s['TM Forum Sponsorship Score'])), backgroundColor: '#e94560' }]}, options: chartDefaults });
        new Chart(document.getElementById('speakersChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Speakers', data: summaryData.map(s => getNum(s['TM Forum Speakers'])), backgroundColor: '#0f3460' }]}, options: chartDefaults });
        new Chart(document.getElementById('catalystChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Catalyst Projects', data: summaryData.map(s => getNum(s['Catalyst Projects'])), backgroundColor: '#533483' }]}, options: chartDefaults });
        new Chart(document.getElementById('whitePapersChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'White Papers', data: summaryData.map(s => getNum(s['White Papers'])), backgroundColor: '#00d4aa' }]}, options: chartDefaults });
        
        // News Charts
        new Chart(document.getElementById('newsCountChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Article Count', data: summaryData.map(s => getNum(s['News Article Count'])), backgroundColor: '#fca311' }]}, options: chartDefaults });
        new Chart(document.getElementById('sentimentChart'), { type: 'bar', data: { labels: summaryData.map(s => s['Company Name']), datasets: [{ label: 'Sentiment Score', data: summaryData.map(s => getNum(s['News Sentiment Score'])), backgroundColor: summaryData.map(s => getNum(s['News Sentiment Score']) >= 0 ? '#10b981' : '#ef4444') }]}, options: chartDefaults });
        new Chart(document.getElementById('newsMatrixChart'), { type: 'scatter', data: { datasets: [{ label: 'Carriers', data: summaryData.map(s => ({ x: getNum(s['News Article Count']), y: getNum(s['News Sentiment Score']), company: s['Company Name'] })), backgroundColor: '#e94560' }]}, options: { ...chartDefaults, plugins: { tooltip: { callbacks: { label: (context) => context.raw.company + ': ' + context.raw.x + ' articles, Sentiment: ' + context.raw.y }}}}});
        
        let sortColumn = -1;
        let sortAsc = true;
        function sortTable(col) {
            const table = document.getElementById('dataTable');
            const tbody = table.getElementsByTagName('tbody')[0];
            const rows = Array.from(tbody.getElementsByTagName('tr'));
            sortAsc = (sortColumn === col) ? !sortAsc : true;
            sortColumn = col;
            table.querySelectorAll('th').forEach(th => { th.classList.remove('sorted-asc', 'sorted-desc'); });
            const th = table.getElementsByTagName('th')[col];
            th.classList.add(sortAsc ? 'sorted-asc' : 'sorted-desc');
            rows.sort((a, b) => {
                const aVal = a.getElementsByTagName('td')[col].textContent;
                const bVal = b.getElementsByTagName('td')[col].textContent;
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);
                if (!isNaN(aNum) && !isNaN(bNum)) { return sortAsc ? aNum - bNum : bNum - aNum; }
                return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            });
            rows.forEach(row => tbody.appendChild(row));
        }
        
        function showDetails(index) {
            const summary = summaryData[index];
            const raw = rawData[index];
            const html = \`
                <h2>\${summary['Company Name']}</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">\${summary['Primary Country']}</p>
                <div class="detail-grid">
                    <div class="detail-item"><div class="detail-label">Revenue</div><div class="detail-value">$\${summary['Carrier Revenue ($B)']}B</div></div>
                    <div class="detail-item"><div class="detail-label">Market Cap</div><div class="detail-value">$\${summary['Market Cap ($B)']}B</div></div>
                    <div class="detail-item"><div class="detail-label">TAM</div><div class="detail-value">\${summary['TAM (%)']}%</div></div>
                    <div class="detail-item"><div class="detail-label">Stock Change YoY</div><div class="detail-value \${getNum(summary['Stock Change YoY (%)']) >= 0 ? 'positive' : 'negative'}">\${summary['Stock Change YoY (%)']}%</div></div>
                    <div class="detail-item"><div class="detail-label">Mobile Customers</div><div class="detail-value">\${summary['Customers - Mobile (M)']}M</div></div>
                    <div class="detail-item"><div class="detail-label">Broadband Customers</div><div class="detail-value">\${summary['Customers - Broadband (M)']}M</div></div>
                    <div class="detail-item"><div class="detail-label">Enterprise Customers</div><div class="detail-value">\${summary['Customers - Enterprise (M)']}M</div></div>
                    <div class="detail-item"><div class="detail-label">TM Forum Sponsorship</div><div class="detail-value">\${summary['TM Forum Sponsorship Score']}</div></div>
                    <div class="detail-item"><div class="detail-label">Speakers</div><div class="detail-value">\${summary['TM Forum Speakers']}</div></div>
                    <div class="detail-item"><div class="detail-label">Catalyst Projects</div><div class="detail-value">\${summary['Catalyst Projects']}</div></div>
                    <div class="detail-item"><div class="detail-label">White Papers</div><div class="detail-value">\${summary['White Papers']}</div></div>
                    <div class="detail-item"><div class="detail-label">News Coverage</div><div class="detail-value">\${summary['News Article Count']} articles</div></div>
                    <div class="detail-item"><div class="detail-label">News Sentiment</div><div class="detail-value \${getNum(summary['News Sentiment Score']) >= 0 ? 'positive' : 'negative'}">\${summary['News Sentiment Score']}</div></div>
                </div>
                <div class="raw-data">
                    <h3>📄 Raw Research Data</h3>
                    <div class="raw-data-item"><div class="raw-data-label">TAM %:</div><div>\${raw['TAM %'] || 'N/A'}</div></div>
                    <div class="raw-data-item"><div class="raw-data-label">Carrier Revenue:</div><div>\${raw['Carrier Revenue'] || 'N/A'}</div></div>
                    <div class="raw-data-item"><div class="raw-data-label">Market Cap:</div><div>\${raw['Market Cap'] || 'N/A'}</div></div>
                    <div class="raw-data-item"><div class="raw-data-label">Customer Base:</div><div>\${raw['Customer Base'] || 'N/A'}</div></div>
                    <div class="raw-data-item"><div class="raw-data-label">TM Forum Speakers:</div><div>\${raw['TM Forum Speakers'] || 'N/A'}</div></div>
                    <div class="raw-data-item"><div class="raw-data-label">TM Forum Sponsorship:</div><div>\${raw['TM Forum Sponsorship'] || 'N/A'}</div></div>
                    <div class="raw-data-item"><div class="raw-data-label">Catalyst Projects:</div><div>\${raw['Catalyst Projects'] || 'N/A'}</div></div>
                    <div class="raw-data-item"><div class="raw-data-label">White Papers:</div><div>\${raw['White Papers'] || 'N/A'}</div></div>
                    <div class="raw-data-item"><div class="raw-data-label">Recent News:</div><div>\${raw['Recent News Articles'] || 'N/A'}</div></div>
                </div>
            \`;
            document.getElementById('modalBody').innerHTML = html;
            document.getElementById('detailModal').classList.add('active');
        }
        
        function closeModal() { document.getElementById('detailModal').classList.remove('active'); }
        document.getElementById('detailModal').addEventListener('click', (e) => { if (e.target.id === 'detailModal') { closeModal(); }});
    </script>
</body>
</html>`;

  fs.writeFileSync(outputFile, html);
}

class CyberFinanceApp {
    constructor() {
        this.state = {
            user: null,
            transactions: [],
            settings: {
                lang: 'uk',
                theme: 'cyberpunk',
                currency: '₴',
                notifications: true
            },
            ads: {
                active: true,
                title: 'ToToShoP // Спецпропозиція',
                text: 'Знижка 15% на всю тактичну екіпіровку та LED-освітлення!',
                link: 'https://totoshop.pp.ua'
            }
        };
        this.chartInstance = null;
        this.initTelegram();
        this.initListeners();
    }

    initTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand();
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                const tgUser = tg.initDataUnsafe.user;
                this.state.user = {
                    name: tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''),
                    email: `tg_${tgUser.id}@nexus.net`,
                    avatar: tgUser.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${tgUser.id}`
                };
                this.completeAuth();
            }
        }
    }

    initListeners() {
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            this.state.user = {
                name: email.split('@')[0],
                email: email,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
            };
            this.completeAuth();
        });

        document.getElementById('telegram-auth-btn').addEventListener('click', () => {
            this.state.user = {
                name: 'Telegram Operative',
                email: 'telegram_user@nexus.net',
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=TelegramUser'
            };
            this.completeAuth();
        });

        // PWA Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            window.deferredPrompt = e;
            document.getElementById('install-pwa-btn').classList.remove('hidden');
        });

        document.getElementById('install-pwa-btn').addEventListener('click', async () => {
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                const { outcome } = await window.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    document.getElementById('install-pwa-btn').classList.add('hidden');
                }
                window.deferredPrompt = null;
            }
        });

        // Image preview in transaction modal
        document.getElementById('tx-image').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('preview-img').src = event.target.result;
                    document.getElementById('image-preview').classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        this.loadLocalStorage();
    }

    completeAuth() {
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('user-display-name').textContent = this.state.user.name;
        document.getElementById('user-avatar').src = this.state.user.avatar;
        this.renderAll();
    }

    loadLocalStorage() {
        const savedData = localStorage.getItem('scrp_nexus_data');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                this.state.transactions = parsed.transactions || [];
                this.state.settings = parsed.settings || this.state.settings;
                this.state.ads = parsed.ads || this.state.ads;
            } catch (e) {
                console.error('Error loading local storage', e);
            }
        } else {
            // Default mock data
            this.state.transactions = [
                { id: 1, type: 'income', amount: 25000, category: 'Зарплата', comment: 'Основний оклад', date: '2026-10-30', image: null },
                { id: 2, type: 'expense', amount: 1500, category: 'Продукти', comment: 'Супермаркет', date: '2026-10-31', image: null }
            ];
        }
        this.applySettingsToDOM();
    }

    saveLocalStorage() {
        localStorage.setItem('scrp_nexus_data', JSON.stringify({
            transactions: this.state.transactions,
            settings: this.state.settings,
            ads: this.state.ads
        }));
    }

    applySettingsToDOM() {
        document.getElementById('setting-lang').value = this.state.settings.lang;
        document.getElementById('setting-theme').value = this.state.settings.theme;
        document.getElementById('setting-currency').value = this.state.settings.currency;
        document.getElementById('setting-notifications').checked = this.state.settings.notifications;

        // Apply Ads
        const banner = document.getElementById('dynamic-ad-banner');
        if (this.state.ads.active) {
            banner.classList.remove('hidden');
            document.getElementById('ad-title').textContent = this.state.ads.title;
            document.getElementById('ad-text').textContent = this.state.ads.text;
            document.getElementById('ad-link').href = this.state.ads.link;
        } else {
            banner.classList.add('hidden');
        }
    }

    switchTab(tabName) {
        ['dashboard', 'analytics', 'settings'].forEach(t => {
            document.getElementById(`view-${t}`).classList.add('hidden');
            document.getElementById(`nav-btn-${t}`).className = 'flex flex-col items-center gap-1 text-cyber-muted hover:text-cyber-text transition-all';
        });
        document.getElementById(`view-${tabName}`).classList.remove('hidden');
        document.getElementById(`nav-btn-${tabName}`).className = 'flex flex-col items-center gap-1 text-cyber-cyan transition-all';
        
        if (tabName === 'analytics') {
            this.renderChart();
        }
    }

    openTransactionModal(type) {
        document.getElementById('tx-type').value = type;
        document.getElementById('modal-title').textContent = type === 'income' ? 'Додати дохід' : 'Додати витрату';
        const select = document.getElementById('tx-category');
        select.innerHTML = '';
        
        const categories = type === 'income' 
            ? ['Зарплата', 'Мама дала', 'Подарували', 'Фріланс', 'Інше']
            : ['Комуналка', 'Кредит', 'Продукти', 'Розваги', 'Авто/Транспорт', 'Техніка', 'Інше'];
            
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });

        document.getElementById('transaction-form').reset();
        document.getElementById('image-preview').classList.add('hidden');
        document.getElementById('transaction-modal').classList.remove('hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    saveTransaction(e) {
        e.preventDefault();
        const type = document.getElementById('tx-type').value;
        const amount = parseFloat(document.getElementById('tx-amount').value);
        const category = document.getElementById('tx-category').value;
        const comment = document.getElementById('tx-comment').value;
        const previewImg = document.getElementById('preview-img').src;
        const hasImage = !document.getElementById('image-preview').classList.contains('hidden');

        const newTx = {
            id: Date.now(),
            type,
            amount,
            category,
            comment,
            date: new Date().toISOString().split('T')[0],
            image: hasImage ? previewImg : null
        };

        this.state.transactions.unshift(newTx);
        this.saveLocalStorage();
        this.closeModal('transaction-modal');
        this.renderAll();
    }

    renderAll() {
        const currency = this.state.settings.currency;
        let income = 0;
        let expense = 0;

        const listContainer = document.getElementById('transactions-list');
        listContainer.innerHTML = '';

        this.state.transactions.forEach(tx => {
            if (tx.type === 'income') income += tx.amount;
            else expense += tx.amount;

            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-3 bg-cyber-bg border border-cyber-border rounded-xl';
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyber-pink/10 text-cyber-pink'} flex items-center justify-center">
                        <i class="fas ${tx.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                    </div>
                    <div>
                        <h4 class="text-xs font-bold">${tx.category}</h4>
                        <p class="text-[10px] text-cyber-muted">${tx.comment || tx.date}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xs font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-cyber-pink'}">
                        ${tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)} ${currency}
                    </span>
                </div>
            `;
            listContainer.appendChild(item);
        });

        const balance = income - expense;
        document.getElementById('total-balance').textContent = balance.toFixed(2);
        document.getElementById('total-income').textContent = `+${income.toFixed(2)} ${currency}`;
        document.getElementById('total-expense').textContent = `-${expense.toFixed(2)} ${currency}`;
        document.getElementById('currency-symbol').textContent = currency;
    }

    renderChart() {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        const expenseMap = {};
        this.state.transactions.filter(t => t.type === 'expense').forEach(t => {
            expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
        });

        const labels = Object.keys(expenseMap);
        const data = Object.values(expenseMap);

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['Немає витрат'],
                datasets: [{
                    data: data.length ? data : [1],
                    backgroundColor: ['#FF007F', '#00F0FF', '#7B2CBF', '#3B82F6', '#10B981', '#F59E0B'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94A3B8', font: { size: 10 } }
                    }
                }
            }
        });
    }

    updateSettings() {
        this.state.settings.lang = document.getElementById('setting-lang').value;
        this.state.settings.theme = document.getElementById('setting-theme').value;
        this.state.settings.currency = document.getElementById('setting-currency').value;
        this.state.settings.notifications = document.getElementById('setting-notifications').checked;
        this.saveLocalStorage();
        this.renderAll();
    }

    verifyAdmin() {
        const code = document.getElementById('admin-code-input').value;
        if (code === '1234SeShQ4321') {
            document.getElementById('admin-auth-container').classList.add('hidden');
            document.getElementById('admin-content-container').classList.remove('hidden');
            document.getElementById('admin-user-count').textContent = '1 (Активний оперативник)';
            document.getElementById('admin-ad-title').value = this.state.ads.title;
            document.getElementById('admin-ad-text').value = this.state.ads.text;
            document.getElementById('admin-ad-link').value = this.state.ads.link;
            document.getElementById('admin-ad-active').checked = this.state.ads.active;
        } else {
            alert('Помилка: Невірний секретний код доступу!');
        }
    }

    saveAdminAds() {
        this.state.ads.title = document.getElementById('admin-ad-title').value;
        this.state.ads.text = document.getElementById('admin-ad-text').value;
        this.state.ads.link = document.getElementById('admin-ad-link').value;
        this.state.ads.active = document.getElementById('admin-ad-active').checked;
        this.saveLocalStorage();
        this.applySettingsToDOM();
        alert('Рекламні параметри оновлено в реальному часі!');
    }

    exportData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", "scrp_nexus_backup.json");
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
    }

    importDataPrompt() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    this.state = parsed;
                    this.saveLocalStorage();
                    this.renderAll();
                    alert('Дані успішно імпортовано!');
                } catch (err) {
                    alert('Помилка імпорту файлу.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}

const app = new CyberFinanceApp();

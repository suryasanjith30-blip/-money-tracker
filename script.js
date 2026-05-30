/* =========================================
   Domain Entities (OOP)
========================================= */
// 164 --expection handling on fecth live market
// what is event handling actullay??
// how the webpage behave when the user reacts with it
// what is expection  handling
//  it is used handle the run time runtimeerrors means it prvents the program to crash
// event handling -- click events mouse leave events
// 1.onmouseleave
//2.onclick
//3.oninput
//4.doc content loading--the event that occures that when webpage is fully loladed
//  means that ensures that elements are loaded only after webpage loaded
//5.event delagation--it is parent class control all child clasees
class Transaction {
  constructor(user, desc, amt, cat, rawDate) {
    this.user = user;
    this.desc = desc;
    this.amt = Number(amt);
    this.cat = cat;
    this.rawDate = rawDate;
    const [year, month, day] = rawDate.split("-");
    const localDate = new Date(year, month - 1, day);
    this.time = localDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
}

/* =========================================
   Core Application Manager
========================================= */
class ExpenseTrackerApp {
  constructor() {
    this.db = JSON.parse(localStorage.getItem("ET_FINAL_DB")) || [];
    this.currentUser = null;
    this.isSignupMode = false;
    this.marketData = [];
    this.simulatedDate = null;

    this.currentCalMonth = this.getToday().getMonth();
    this.currentCalYear = this.getToday().getFullYear();
    this.editingDateIndex = null;

    this.initTheme();
    this.populateCalendarDropdowns();
    this.attachEventListeners();
  }

  getToday() {
    return this.simulatedDate ? new Date(this.simulatedDate) : new Date();
  }
  getTodayStr() {
    const d = this.getToday();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  convertNumberToWords(amount) {
    if (amount === 0) return "Zero Rupees";
    const a = [
      "",
      "One ",
      "Two ",
      "Three ",
      "Four ",
      "Five ",
      "Six ",
      "Seven ",
      "Eight ",
      "Nine ",
      "Ten ",
      "Eleven ",
      "Twelve ",
      "Thirteen ",
      "Fourteen ",
      "Fifteen ",
      "Sixteen ",
      "Seventeen ",
      "Eighteen ",
      "Nineteen ",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const inWords = (n) => {
      let str = "";
      if (n > 99) {
        str += a[Math.floor(n / 100)] + "Hundred ";
        n %= 100;
      }
      if (n > 19) {
        str += b[Math.floor(n / 10)] + " ";
        n %= 10;
      }
      if (n > 0) {
        str += a[n];
      }
      return str.trim();
    };

    let word = "";
    let val = Math.floor(Math.abs(amount));
    let isNegative = amount < 0;

    if (val >= 10000000) {
      word += inWords(Math.floor(val / 10000000)) + " Crore ";
      val %= 10000000;
    }
    if (val >= 100000) {
      word += inWords(Math.floor(val / 100000)) + " Lakh ";
      val %= 100000;
    }
    if (val >= 1000) {
      word += inWords(Math.floor(val / 1000)) + " Thousand ";
      val %= 1000;
    }
    if (val > 0) {
      word += inWords(val);
    }

    let finalStr = word.trim() + " Rupees";
    return isNegative ? "Minus " + finalStr : finalStr;
  }

  populateCalendarDropdowns() {
    const monthSelect = document.getElementById("cal-month-select");
    const yearSelect = document.getElementById("cal-year-select");

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    months.forEach((m, i) => {
      let opt = document.createElement("option");
      opt.value = i;
      opt.innerText = m;
      monthSelect.appendChild(opt);
    });

    const currentY = this.getToday().getFullYear();
    for (let y = currentY - 5; y <= currentY + 5; y++) {
      let opt = document.createElement("option");
      opt.value = y;
      opt.innerText = y;
      yearSelect.appendChild(opt);
    }
  }

  async fetchLiveMarketData() {
    const marketTable = document.getElementById("market-list-ui");
    marketTable.innerHTML = `<tr><td colspan='6' style='text-align:center; padding: 40px;'><span class="loading-pulse">Fetching Live Market Data... 📡</span></td></tr>`;
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const baseData = [
        { n: "RELIANCE", p: 2980 },
        { n: "TCS", p: 4120 },
        { n: "ZOMATO", p: 194 },
        { n: "TATA MOTORS", p: 965 },
        { n: "INFY", p: 1540 },
        { n: "SBI", p: 820 },
      ];
      this.marketData = baseData.map((stock) => {
        const livePrice = Math.round(
          stock.p * (1 + (Math.random() * 0.06 - 0.03)),
        );
        let trend = "Med";
        if (livePrice > stock.p + 20) trend = "High";
        if (livePrice < stock.p - 20) trend = "Low";
        return { n: stock.n, p: livePrice, t: trend };
      });
      this.refreshUI();
    } catch (error) {
      marketTable.innerHTML = `<tr><td colspan='6' style='text-align:center; color: var(--danger);'>API Failed.</td></tr>`;
    }
  }

  saveData() {
    const idx = this.db.findIndex(
      (u) => u.username === this.currentUser.username,
    );
    if (idx !== -1) {
      this.db[idx] = this.currentUser;
    } else {
      this.db.push(this.currentUser);
    }
    localStorage.setItem("ET_FINAL_DB", JSON.stringify(this.db));
    this.refreshUI();
  }

  initTheme() {
    const savedTheme = localStorage.getItem("ET_THEME") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  attachEventListeners() {
    document
      .getElementById("btn-toggle-auth")
      .addEventListener("click", () => this.toggleAuth());
    document
      .getElementById("main-auth-btn")
      .addEventListener("click", () => this.handleAuthClick());
    document
      .getElementById("pass-in")
      .addEventListener("input", () => this.liveSecurityCheck());
    document
      .getElementById("btn-set-income")
      .addEventListener("click", () => this.setInitialIncome());

    document.querySelectorAll(".nav-item").forEach((nav) => {
      nav.addEventListener("click", (e) => this.switchTab(e.currentTarget));
    });
    document
      .getElementById("btn-logout")
      .addEventListener("click", () => location.reload());

    // Flip Card Listeners
    const flipContainer = document.getElementById("balance-flip-container");
    flipContainer.addEventListener("click", function () {
      this.classList.toggle("flipped");
    });
    flipContainer.addEventListener("mouseleave", function () {
      this.classList.remove("flipped");
    });

    document
      .getElementById("exp-cat")
      .addEventListener("change", () => this.validateTransactionAmount());
    document
      .getElementById("exp-amt")
      .addEventListener("input", () => this.validateTransactionAmount());
    document
      .getElementById("btn-save-exp")
      .addEventListener("click", () => this.saveTransaction());

    ["search-history", "filter-cat", "filter-start", "filter-end"].forEach(
      (id) =>
        document
          .getElementById(id)
          .addEventListener("input", () => this.refreshUI()),
    );
    document
      .getElementById("btn-clear-filters")
      .addEventListener("click", () => {
        document.getElementById("search-history").value = "";
        document.getElementById("filter-cat").value = "All";
        document.getElementById("filter-start").value = "";
        document.getElementById("filter-end").value = "";
        this.refreshUI();
      });

    // Exports
    document
      .getElementById("btn-export-csv")
      .addEventListener("click", () => this.exportToCSV());
    document
      .getElementById("btn-export-pdf")
      .addEventListener("click", () => this.exportToPDF());

    // Subs & Pockets
    document
      .getElementById("btn-add-sub")
      .addEventListener("click", () => this.addSubscription());
    document.getElementById("subs-list").addEventListener("click", (e) => {
      if (e.target.dataset.action === "delete-sub") {
        this.currentUser.subs.splice(e.target.dataset.index, 1);
        this.saveData();
        this.renderSubs();
      }
    });
    document
      .getElementById("btn-add-pocket")
      .addEventListener("click", () => this.addPocket());
    document.getElementById("pockets-list").addEventListener("click", (e) => {
      if (e.target.dataset.action === "fund-pocket")
        this.fundPocket(e.target.dataset.index);
    });

    // Split Billing
    document
      .getElementById("btn-add-person")
      .addEventListener("click", () => this.addPerson());
    document.getElementById("person-list").addEventListener("click", (e) => {
      if (e.target.dataset.action === "delete-person")
        this.deletePerson(e.target.dataset.index);
      if (e.target.dataset.action === "bill-person")
        this.billPerson(e.target.dataset.index);
    });

    // History Actions
    document.getElementById("history-body").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.action === "delete-tx")
        this.deleteTransaction(btn.dataset.index);
      if (btn.dataset.action === "edit-date")
        this.editTransactionDate(btn.dataset.index);
    });

    document.getElementById("btn-cancel-date").addEventListener("click", () => {
      document.getElementById("edit-date-modal").style.display = "none";
    });
    document.getElementById("btn-save-date").addEventListener("click", () => {
      const newDate = document.getElementById("new-tx-date").value;
      if (newDate && this.editingDateIndex !== null) {
        const tx = this.currentUser.expenses[this.editingDateIndex];
        tx.rawDate = newDate;
        const [year, month, day] = newDate.split("-");
        const localDate = new Date(year, month - 1, day);
        tx.time = localDate.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        this.saveData();
        document.getElementById("edit-date-modal").style.display = "none";
      }
    });

    // Market Buy
    document.getElementById("market-list-ui").addEventListener("click", (e) => {
      if (e.target.dataset.action === "buy-asset")
        this.buyAsset(e.target.dataset.symbol, Number(e.target.dataset.price));
    });

    // Full Calendar
    document
      .getElementById("full-calendar-grid")
      .addEventListener("click", (e) => {
        const cell = e.target.closest(".cal-page-cell");
        if (cell && cell.dataset.date) this.viewDayDetails(cell.dataset.date);
      });
    document.getElementById("btn-close-modal").addEventListener("click", () => {
      document.getElementById("day-modal").style.display = "none";
    });

    document.getElementById("btn-prev-month").addEventListener("click", () => {
      this.currentCalMonth--;
      if (this.currentCalMonth < 0) {
        this.currentCalMonth = 11;
        this.currentCalYear--;
      }
      this.renderFullCalendar();
    });
    document.getElementById("btn-next-month").addEventListener("click", () => {
      this.currentCalMonth++;
      if (this.currentCalMonth > 11) {
        this.currentCalMonth = 0;
        this.currentCalYear++;
      }
      this.renderFullCalendar();
    });
    document
      .getElementById("cal-month-select")
      .addEventListener("change", (e) => {
        this.currentCalMonth = Number(e.target.value);
        this.renderFullCalendar();
      });
    document
      .getElementById("cal-year-select")
      .addEventListener("change", (e) => {
        this.currentCalYear = Number(e.target.value);
        this.renderFullCalendar();
      });

    // Reveal Time Travel Logic
    document
      .getElementById("btn-reveal-time-travel")
      .addEventListener("click", (e) => {
        const controls = document.getElementById("time-travel-controls");
        if (controls.classList.contains("hidden")) {
          controls.classList.remove("hidden");
          e.target.innerText = "Hide time travel options";
        } else {
          controls.classList.add("hidden");
          e.target.innerText = "Yes, show time travel options";
        }
      });

    // Time Travel Action Logic
    document
      .getElementById("btn-update-sys-date")
      .addEventListener("click", () => {
        const newDate = document.getElementById("sys-date-override").value;
        if (newDate) {
          this.simulatedDate = newDate;
          this.currentCalMonth = this.getToday().getMonth();
          this.currentCalYear = this.getToday().getFullYear();
          this.startApp();
          alert(`Time traveled to ${newDate}! 🚀`);
        }
      });
    document
      .getElementById("btn-reset-sys-date")
      .addEventListener("click", () => {
        this.simulatedDate = null;
        document.getElementById("sys-date-override").value = "";
        this.currentCalMonth = this.getToday().getMonth();
        this.currentCalYear = this.getToday().getFullYear();
        this.startApp();
        alert("Welcome back to the present! 🕰️");
      });

    // Other Settings
    document
      .getElementById("btn-update-salary")
      .addEventListener("click", () => {
        const amt = Number(document.getElementById("set-salary-amt").value);
        const date = Number(document.getElementById("set-salary-date").value);
        if (amt > 0 && date >= 1 && date <= 31) {
          this.currentUser.monthlySalary = amt;
          this.currentUser.salaryDate = date;
          this.saveData();
          alert("Automated Salary Settings Updated!");
        } else {
          alert("Please provide valid values.");
        }
      });
    document
      .getElementById("btn-update-limit")
      .addEventListener("click", () => {
        const val = Number(document.getElementById("set-goal-input").value);
        if (val > 0) {
          this.currentUser.goal = val;
          this.saveData();
          alert("Spend Target Updated");
        }
      });
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.documentElement.setAttribute(
          "data-theme",
          e.currentTarget.dataset.themeVal,
        );
        localStorage.setItem("ET_THEME", e.currentTarget.dataset.themeVal);
        this.drawCharts();
      });
    });
    document
      .getElementById("btn-refresh-market")
      .addEventListener("click", () => this.fetchLiveMarketData());
  }

  toggleAuth() {
    this.isSignupMode = !this.isSignupMode;
    document.getElementById("signup-extras").classList.toggle("hidden");
    document.getElementById("main-auth-btn").innerText = this.isSignupMode
      ? "Create Account"
      : "Log In";
    document.getElementById("switch-prompt").innerText = this.isSignupMode
      ? "Already have an account?"
      : "New user?";

    document.getElementById("user-in").value = "";
    document.getElementById("pass-in").value = "";
    document.getElementById("confirm-in").value = "";
    document.getElementById("pass-msg").style.display = "none";
  }

  liveSecurityCheck() {
    if (!this.isSignupMode) return;
    const p = document.getElementById("pass-in").value;
    const isStrong = p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);
    const msg = document.getElementById("pass-msg");
    msg.style.display = "block";
    msg.innerText = isStrong
      ? "✅ Strong Password"
      : "❌ Weak (Needs 8+ chars, 1 Cap, 1 Num)";
    msg.style.color = isStrong ? "var(--success)" : "var(--danger)";
  }

  handleAuthClick() {
    const u = document.getElementById("user-in").value.trim();
    const p = document.getElementById("pass-in").value;

    if (this.isSignupMode) {
      const c = document.getElementById("confirm-in").value;
      if (!u || p !== c || p.length < 8) return alert("Verify fields.");
      this.db.push({
        username: u,
        password: p,
        income: 0,
        goal: 0,
        expenses: [],
        subs: [],
        persons: [],
        pockets: [],
        portfolio: [],
        monthlySalary: 0,
        salaryDate: 1,
        processedSalaryMonths: [],
      });
      localStorage.setItem("ET_FINAL_DB", JSON.stringify(this.db));
      this.toggleAuth();
    } else {
      const user = this.db.find((x) => x.username === u && x.password === p);
      if (!user) return alert("Invalid credentials.");

      if (user.pockets === undefined) user.pockets = [];
      if (user.portfolio === undefined) user.portfolio = [];
      if (user.monthlySalary === undefined) {
        user.monthlySalary = user.income;
        user.salaryDate = 1;
      }
      if (user.processedSalaryMonths === undefined) {
        user.processedSalaryMonths = user.lastSalaryMonth
          ? [user.lastSalaryMonth]
          : [];
      }

      this.currentUser = user;
      if (this.currentUser.monthlySalary <= 0) {
        document.getElementById("auth-screen").style.display = "none";
        document.getElementById("income-overlay").style.display = "flex";
      } else {
        document.getElementById("auth-screen").style.display = "none";
        this.startApp();
      }
    }
  }

  setInitialIncome() {
    const salary = Number(document.getElementById("initial-salary").value);
    const sDate = Number(document.getElementById("initial-salary-date").value);

    if (salary <= 0 || sDate < 1 || sDate > 28)
      return alert("Please enter a valid salary and payday (1-28).");

    this.currentUser.monthlySalary = salary;
    this.currentUser.salaryDate = sDate;
    this.currentUser.goal = salary;
    this.currentUser.income = 0;

    const currentMonthStr = this.getTodayStr().slice(0, 7);
    this.currentUser.processedSalaryMonths = [currentMonthStr];

    const tx = new Transaction(
      "System",
      "Initial Setup Salary Drop",
      salary,
      "Income",
      this.getTodayStr(),
    );
    this.currentUser.expenses.push(tx);

    this.saveData();
    document.getElementById("income-overlay").style.display = "none";
    this.startApp();
  }

  startApp() {
    document.getElementById("app-screen").style.display = "flex";
    document.getElementById("exp-date").value = this.getTodayStr();

    const hour = this.getToday().getHours();
    let greeting = "Good Evening";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 17) greeting = "Good Afternoon";
    document.getElementById("greeting-ui").innerHTML =
      `${greeting}, <span style="color: var(--primary)">${this.currentUser.username}</span>!`;

    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    document.getElementById("date-ui").innerText =
      this.getToday().toLocaleDateString("en-US", options);

    this.checkAutoBilling();
    this.fetchLiveMarketData();
    this.refreshUI();
  }

  checkAutoBilling() {
    const today = this.getToday();
    const currMonthStr = this.getTodayStr().slice(0, 7);
    const currDay = today.getDate();
    let processed = false;

    if (!this.currentUser.processedSalaryMonths)
      this.currentUser.processedSalaryMonths = [];
    if (this.currentUser.processedSalaryMonths.length === 0) {
      this.currentUser.processedSalaryMonths.push(currMonthStr);
    }

    const sortedMonths = [...this.currentUser.processedSalaryMonths].sort();
    const earliestMonth = sortedMonths[0];

    let [y, m] = earliestMonth.split("-").map(Number);
    let catchUpMonths = [];
    let loopCount = 0;

    while (
      `${y}-${String(m).padStart(2, "0")}` <= currMonthStr &&
      loopCount < 120
    ) {
      catchUpMonths.push(`${y}-${String(m).padStart(2, "0")}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
      loopCount++;
    }

    catchUpMonths.forEach((targetMonth) => {
      const isCurrentMonth = targetMonth === currMonthStr;
      const validDay = isCurrentMonth ? currDay : 31;

      if (
        this.currentUser.salaryDate &&
        validDay >= this.currentUser.salaryDate &&
        !this.currentUser.processedSalaryMonths.includes(targetMonth)
      ) {
        const dropDateStr = `${targetMonth}-${String(this.currentUser.salaryDate).padStart(2, "0")}`;
        const tx = new Transaction(
          "System",
          "Monthly Salary Auto-Deposit",
          this.currentUser.monthlySalary,
          "Income",
          dropDateStr,
        );
        this.currentUser.expenses.push(tx);
        this.currentUser.processedSalaryMonths.push(targetMonth);
        processed = true;
      }

      this.currentUser.subs.forEach((s) => {
        if (!s.processedMonths) s.processedMonths = [];
        const created = s.createdMonth || "2000-01";

        if (
          targetMonth >= created &&
          validDay >= s.day &&
          !s.processedMonths.includes(targetMonth)
        ) {
          const dropDateStr = `${targetMonth}-${String(s.day).padStart(2, "0")}`;
          const tx = new Transaction(
            "System",
            `Auto-Bill: ${s.name}`,
            s.amt,
            "Bills",
            dropDateStr,
          );
          this.currentUser.expenses.push(tx);
          s.processedMonths.push(targetMonth);
          processed = true;
        }
      });
    });

    if (processed) {
      alert(
        "Temporal Sync Complete! ⏳ Automated transactions have caught up to your destination date.",
      );
      this.saveData();
    }
  }

  switchTab(el) {
    const target = el.dataset.target;
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.add("hidden"));
    document.getElementById(target).classList.remove("hidden");
    document
      .querySelectorAll(".nav-item")
      .forEach((n) => n.classList.remove("active"));
    el.classList.add("active");

    if (target === "split") this.renderPersons();
    if (target === "subs") this.renderSubs();
    if (target === "pockets") this.renderPockets();
    if (target === "calendar") this.renderFullCalendar();
    this.refreshUI();
  }

  getCalculatedBalance() {
    let balance = this.currentUser.income || 0;
    this.currentUser.expenses.forEach((e) => {
      if (e.cat === "Income") {
        balance += e.amt;
      } else {
        balance -= e.amt;
      }
    });
    return balance;
  }

  addPocket() {
    const name = document.getElementById("pocket-name").value;
    const target = Number(document.getElementById("pocket-target").value);
    if (name && target > 0) {
      this.currentUser.pockets.push({ name, target, saved: 0 });
      this.saveData();
      document.getElementById("pocket-name").value = "";
      document.getElementById("pocket-target").value = "";
      this.renderPockets();
    }
  }
  fundPocket(index) {
    const amt = Number(document.getElementById(`fund-amt-${index}`).value);
    if (amt > 0 && this.getCalculatedBalance() >= amt) {
      const pocket = this.currentUser.pockets[index];
      pocket.saved += amt;
      const tx = new Transaction(
        "Me",
        `Transfer to Pocket: ${pocket.name}`,
        amt,
        "Transfer",
        this.getTodayStr(),
      );
      this.currentUser.expenses.push(tx);
      this.saveData();
      this.renderPockets();
    } else {
      alert("Insufficient available balance or invalid amount.");
    }
  }
  renderPockets() {
    const list = document.getElementById("pockets-list");
    list.innerHTML = this.currentUser.pockets
      .map((p, i) => {
        const perc = Math.min(100, (p.saved / p.target) * 100);
        return `
          <div class="card" style="padding: 16px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                  <strong>${p.name}</strong> <span>₹${p.saved.toLocaleString()} / ₹${p.target.toLocaleString()}</span>
              </div>
              <div class="progress-container" style="height: 6px; margin-bottom: 15px;"><div class="progress-bar" style="width: ${perc}%; background:var(--warning);"></div></div>
              <div class="pocket-grid">
                  <input id="fund-amt-${i}" type="number" min="1" class="input-field" style="margin:0" placeholder="₹ Amount">
                  <button class="btn-action btn-small" data-action="fund-pocket" data-index="${i}">Lock Funds</button>
              </div>
          </div>`;
      })
      .join("");
  }

  validateTransactionAmount() {
    const amt = Number(document.getElementById("exp-amt").value);
    const cat = document.getElementById("exp-cat").value;
    const isLow = amt > this.getCalculatedBalance() && cat !== "Income";
    const btn = document.getElementById("btn-save-exp");
    btn.disabled = isLow;
    btn.innerText = isLow ? "Low Funds" : "Save Transaction";
  }

  saveTransaction() {
    const desc = document.getElementById("exp-desc").value;
    const amt = document.getElementById("exp-amt").value;
    const cat = document.getElementById("exp-cat").value;
    const dateStr = document.getElementById("exp-date").value;
    if (!desc || amt <= 0 || !dateStr) return alert("Fill fields.");

    this.currentUser.expenses.push(
      new Transaction("Me", desc, amt, cat, dateStr),
    );
    this.saveData();

    document.getElementById("exp-desc").value = "";
    document.getElementById("exp-amt").value = "";
    this.validateTransactionAmount();
  }

  editTransactionDate(index) {
    this.editingDateIndex = index;
    const tx = this.currentUser.expenses[index];
    document.getElementById("edit-date-desc").innerText =
      `Updating date for: ${tx.desc} (₹${tx.amt})`;
    document.getElementById("new-tx-date").value = tx.rawDate;
    document.getElementById("edit-date-modal").style.display = "flex";
  }

  deleteTransaction(index) {
    if (confirm("Permanently delete this transaction?")) {
      const tx = this.currentUser.expenses[index];
      if (tx.cat === "Transfer") {
        const pocketName = tx.desc.replace("Transfer to Pocket: ", "");
        const pocket = this.currentUser.pockets.find(
          (p) => p.name === pocketName,
        );
        if (pocket) pocket.saved -= tx.amt;
      }
      if (tx.cat === "Investment" && tx.desc.includes("Bought 1x")) {
        const symbol = tx.desc.replace("Bought 1x ", "");
        const asset = this.currentUser.portfolio.find(
          (a) => a.symbol === symbol,
        );
        if (asset) {
          asset.invested -= tx.amt;
          asset.shares -= 1;
          if (asset.shares <= 0) {
            this.currentUser.portfolio = this.currentUser.portfolio.filter(
              (a) => a.symbol !== symbol,
            );
          }
        }
      }
      if (tx.user === "System") {
        const txMonth = tx.rawDate.slice(0, 7);
        if (tx.cat === "Income") {
          this.currentUser.processedSalaryMonths =
            this.currentUser.processedSalaryMonths.filter((m) => m !== txMonth);
        } else if (tx.cat === "Bills") {
          const subName = tx.desc.replace("Auto-Bill: ", "");
          const sub = this.currentUser.subs.find((s) => s.name === subName);
          if (sub && sub.processedMonths) {
            sub.processedMonths = sub.processedMonths.filter(
              (m) => m !== txMonth,
            );
          }
        }
      }
      this.currentUser.expenses.splice(index, 1);
      this.saveData();
    }
  }

  addSubscription() {
    const name = document.getElementById("sub-name").value;
    const amt = Number(document.getElementById("sub-amt").value);
    const day = Number(document.getElementById("sub-day").value);
    if (name && amt > 0 && day > 0 && day <= 28) {
      const currentMonthStr = this.getTodayStr().slice(0, 7);
      this.currentUser.subs.push({
        name,
        amt,
        day,
        processedMonths: [],
        createdMonth: currentMonthStr,
      });
      this.saveData();
      document.getElementById("sub-name").value = "";
      document.getElementById("sub-amt").value = "";
      this.renderSubs();
    } else {
      alert("Ensure day is between 1-28");
    }
  }
  renderSubs() {
    document.getElementById("subs-list").innerHTML = this.currentUser.subs
      .map(
        (s, i) => `
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:16px 20px;">
        <span style="font-size:15px;"><strong>${s.name}</strong> <span style="color:var(--text-dim); margin-left:10px;">₹${s.amt}/mo (Bills on ${s.day})</span></span>
        <button class="delete-btn" data-action="delete-sub" data-index="${i}">🗑️</button>
      </div>`,
      )
      .join("");
  }

  addPerson() {
    const n = document.getElementById("person-name").value.trim().toUpperCase();
    if (n && !this.currentUser.persons.includes(n)) {
      this.currentUser.persons.push(n);
      this.saveData();
      this.renderPersons();
    }
  }
  deletePerson(i) {
    if (confirm("Remove?")) {
      this.currentUser.persons.splice(i, 1);
      this.saveData();
      this.renderPersons();
    }
  }
  billPerson(i) {
    const amt = Number(document.getElementById(`split-amt-${i}`).value);
    if (amt > 0 && this.getCalculatedBalance() >= amt) {
      const desc =
        document.getElementById(`split-desc-${i}`).value || "Split Expense";
      const cat = document.getElementById(`split-cat-${i}`).value;
      this.currentUser.expenses.push(
        new Transaction(
          this.currentUser.persons[i],
          desc,
          amt,
          cat,
          this.getTodayStr(),
        ),
      );
      this.saveData();
      alert("Billed!");
      this.renderPersons();
    }
  }
  renderPersons() {
    document.getElementById("person-list").innerHTML = this.currentUser.persons
      .map(
        (p, i) => `
      <div class="card" style="padding: 20px;">
          <div style="display:flex; justify-content:space-between; margin-bottom: 15px;">
            <strong style="font-size: 16px; color: var(--primary);">👤 ${p}</strong>
            <button class="delete-btn" data-action="delete-person" data-index="${i}">🗑️</button>
          </div>
          <div class="split-grid">
            <input id="split-desc-${i}" class="input-field" style="margin:0" placeholder="Reason">
            <select id="split-cat-${i}" class="input-field" style="margin:0; padding: 12px 8px;">
              <option value="Food">🍕 Food</option>
              <option value="Groceries">🛒 Groceries</option>
              <option value="Travel">🚗 Travel</option>
              <option value="Shopping">🛍️ Shopping</option>
              <option value="Bills" selected>📄 Bills</option>
              <option value="Utilities">💡 Utilities</option>
              <option value="Rent">🏠 Rent</option>
              <option value="Health">⚕️ Health</option>
              <option value="Personal">💅 Personal Care</option>
              <option value="Entertainment">🎬 Ent.</option>
              <option value="Gifts">🎁 Gifts</option>
              <option value="Other">📌 Other</option>
            </select>
            <input id="split-amt-${i}" type="number" min="1" class="input-field" style="margin:0" placeholder="₹ Amount">
            <button class="btn-action" data-action="bill-person" data-index="${i}" style="margin:0">Bill</button>
          </div>
      </div>`,
      )
      .join("");
  }

  buyAsset(symbol, price) {
    if (this.getCalculatedBalance() < price)
      return alert("Insufficient funds!");
    this.currentUser.expenses.push(
      new Transaction(
        "Me",
        `Bought 1x ${symbol}`,
        price,
        "Investment",
        this.getTodayStr(),
      ),
    );
    let holding = this.currentUser.portfolio.find((a) => a.symbol === symbol);
    if (holding) {
      holding.shares += 1;
      holding.invested += price;
    } else {
      this.currentUser.portfolio.push({
        symbol,
        shares: 1,
        invested: price,
      });
    }
    this.saveData();
    alert(`1 Unit of ${symbol} secured.`);
  }
  renderPortfolio() {
    const portList = document.getElementById("portfolio-list-ui");
    if (this.currentUser.portfolio.length === 0) {
      portList.innerHTML =
        "<tr><td colspan='5' style='text-align:center; color:var(--text-dim);'>No assets currently owned.</td></tr>";
      return;
    }
    portList.innerHTML =
      `<thead><tr><th>Asset</th><th>Shares</th><th>Avg Buy</th><th>Current Value</th><th>Profit/Loss</th></tr></thead><tbody>` +
      this.currentUser.portfolio
        .map((h) => {
          const liveData = this.marketData.find((m) => m.n === h.symbol);
          const livePrice = liveData ? liveData.p : h.invested / h.shares;
          const currVal = livePrice * h.shares;
          const pnl = currVal - h.invested;
          const pnlClass = pnl >= 0 ? "green-bg" : "red-bg";
          return `
          <tr>
              <td style="font-weight:bold;">${h.symbol}</td>
              <td>${h.shares}</td>
              <td style="color:var(--text-dim)">₹${Math.round(h.invested / h.shares).toLocaleString()}</td>
              <td style="font-weight:bold;">₹${currVal.toLocaleString()}</td>
              <td><span class="badge ${pnlClass}">${pnl >= 0 ? "+" : ""}₹${pnl.toLocaleString()}</span></td>
          </tr>`;
        })
        .join("") +
      `</tbody>`;
  }

  renderFullCalendar() {
    const year = this.currentCalYear;
    const month = this.currentCalMonth;
    const today = this.getToday();

    document.getElementById("cal-month-select").value = month;
    document.getElementById("cal-year-select").value = year;

    let dailySpends = {};
    this.currentUser.expenses.forEach((e) => {
      if (e.cat !== "Transfer" && e.cat !== "Income") {
        const [y, m, d] = e.rawDate.split("-");
        if (Number(y) === year && Number(m) - 1 === month) {
          dailySpends[e.rawDate] = (dailySpends[e.rawDate] || 0) + e.amt;
        }
      }
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calGrid = document.getElementById("full-calendar-grid");
    let html = `
      <div style="display:contents">
          <div class="cal-day-label">Sun</div><div class="cal-day-label">Mon</div><div class="cal-day-label">Tue</div><div class="cal-day-label">Wed</div>
          <div class="cal-day-label">Thu</div><div class="cal-day-label">Fri</div><div class="cal-day-label">Sat</div>
      </div>`;

    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-page-cell cal-empty"></div>`;
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const amt = dailySpends[dateStr]
        ? `₹${dailySpends[dateStr].toLocaleString()}`
        : "";

      const isToday =
        i === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
          ? "background: rgba(124, 58, 237, 0.3); border-color: var(--primary);"
          : "";

      html += `
        <div class="cal-page-cell" style="${isToday}" data-date="${dateStr}">
          <span class="cal-page-date">${i}</span>
          <span class="cal-page-amt">${amt}</span>
        </div>
      `;
    }

    calGrid.innerHTML = html;
  }

  viewDayDetails(dateStr) {
    const [y, m, d] = dateStr.split("-");
    const displayDate = new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    document.getElementById("modal-date-title").innerText = displayDate;

    const dayExpenses = this.currentUser.expenses.filter(
      (e) =>
        e.rawDate === dateStr && e.cat !== "Transfer" && e.cat !== "Income",
    );
    const content = document.getElementById("modal-content");

    if (dayExpenses.length === 0) {
      content.innerHTML = `<p style="text-align:center; color: var(--text-dim); padding: 20px;">No spendings recorded on this day.</p>`;
    } else {
      let catTotals = {};
      let total = 0;
      dayExpenses.forEach((e) => {
        catTotals[e.cat] = (catTotals[e.cat] || 0) + e.amt;
        total += e.amt;
      });

      let html = `<div style="margin-bottom: 20px; text-align: center; padding-bottom: 20px; border-bottom: 1px solid var(--border);">
          <span style="font-size: 12px; color: var(--text-dim); font-weight: bold; letter-spacing: 1px;">TOTAL SPENT</span>
          <h1 style="margin: 5px 0 0; color: #fb7185;">₹${total.toLocaleString()}</h1>
        </div>`;

      for (let cat in catTotals) {
        html += `
            <div style="display:flex; justify-content:space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-weight: 500; color: var(--text-main);">${cat}</span>
              <span style="font-weight: bold; color: var(--text-main);">₹${catTotals[cat].toLocaleString()}</span>
            </div>`;
      }
      content.innerHTML = html;
    }

    document.getElementById("day-modal").style.display = "flex";
  }

  // --- Export Functions ---
  exportToCSV() {
    if (this.currentUser.expenses.length === 0)
      return alert("No transactions available to export.");
    let csv = "Date,User,Description,Category,Amount\n";

    const fTxs = this._getFilteredTransactions();
    fTxs.forEach((e) => {
      const prefix = e.cat === "Income" ? "+" : "-";
      csv += `"${e.rawDate}","${e.user}","${e.desc}","${e.cat}","${prefix}${e.amt}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ProTracker_Export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  exportToPDF() {
    if (this.currentUser.expenses.length === 0)
      return alert("No transactions available to export.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(124, 58, 237); // Primary Purple
    doc.text("Ultimate Pro - Expense Report", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`User: ${this.currentUser.username}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);

    const tableColumn = ["Date", "Description", "Category", "Amount"];
    const tableRows = [];

    const fTxs = this._getFilteredTransactions();

    fTxs.forEach((e) => {
      const isIncome = e.cat === "Income";
      const amountStr = isIncome ? `+ INR ${e.amt}` : `- INR ${e.amt}`;
      tableRows.push([e.time, e.desc, e.cat, amountStr]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: "grid",
      headStyles: { fillColor: [124, 58, 237] },
    });

    doc.save("ProTracker_Report.pdf");
  }

  _getFilteredTransactions() {
    const kw = document.getElementById("search-history").value.toLowerCase();
    const fCat = document.getElementById("filter-cat").value;
    const fS = document.getElementById("filter-start").value;
    const fE = document.getElementById("filter-end").value;

    return this.currentUser.expenses
      .filter((e) => {
        if (!e.desc.toLowerCase().includes(kw)) return false;
        if (fCat !== "All" && e.cat !== fCat) return false;
        if (fS && new Date(e.rawDate) < new Date(fS)) return false;
        if (fE && new Date(e.rawDate) > new Date(fE)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  }

  refreshUI() {
    if (!this.currentUser) return;
    const bal = this.getCalculatedBalance();

    const today = this.getToday();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();
    const daysLeft = daysInMonth - today.getDate() + 1;

    // Update UI for Balance and Words
    document.getElementById("total-bal-ui").innerText =
      `₹${bal.toLocaleString()}`;
    document.getElementById("total-bal-words").innerText =
      this.convertNumberToWords(bal);

    const dailySafe = Math.floor(bal / daysLeft);
    const ssEl = document.getElementById("daily-safe-ui");
    ssEl.innerText = `₹${Math.max(0, dailySafe).toLocaleString()}`;
    ssEl.style.color =
      dailySafe < 200
        ? "var(--danger)"
        : dailySafe < 500
          ? "var(--warning)"
          : "var(--success)";

    const spent = this.currentUser.expenses
      .filter((e) => e.cat !== "Transfer" && e.cat !== "Income")
      .reduce((s, e) => s + e.amt, 0);
    const usagePercent = Math.min(100, (spent / this.currentUser.goal) * 100);
    const gBar = document.getElementById("goal-bar");
    gBar.style.width = `${usagePercent}%`;
    gBar.style.backgroundColor =
      usagePercent > 90
        ? "var(--danger)"
        : usagePercent > 75
          ? "var(--warning)"
          : "var(--primary)";
    document.getElementById("goal-text").innerText =
      `₹${spent.toLocaleString()} / ₹${this.currentUser.goal.toLocaleString()} Limit`;

    const fTxs = this._getFilteredTransactions();

    document.getElementById("history-body").innerHTML = fTxs
      .map((e) => {
        const oIdx = this.currentUser.expenses.indexOf(e);
        const isIncome = e.cat === "Income";
        const amountColor = isIncome ? "var(--success)" : "#e11d48";
        const amountPrefix = isIncome ? "+" : "-";

        return `<tr>
          <td style="color: var(--text-dim);">${e.time}</td>
          <td><span class="user-tag">${e.user}</span></td>
          <td style="font-weight: 500;">${e.desc}</td>
          <td><span class="badge" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-dim);">${e.cat}</span></td>
          <td style="color: ${amountColor}; font-weight: bold; white-space: nowrap;">${amountPrefix}₹${e.amt.toLocaleString()}</td>
          <td style="width: 80px;">
            <div style="display: flex; gap: 12px; justify-content: center; align-items: center;">
              <button class="delete-btn" style="color: var(--primary); margin:0;" data-action="edit-date" data-index="${oIdx}" title="Edit Date">✏️</button>
              <button class="delete-btn" style="margin:0;" data-action="delete-tx" data-index="${oIdx}" title="Delete">🗑️</button>
            </div>
          </td>
        </tr>`;
      })
      .join("");

    if (this.marketData.length > 0) {
      document.getElementById("market-list-ui").innerHTML =
        `<thead><tr><th>Asset</th><th>Live Price</th><th>Purchasing Power</th><th>Trend</th><th>Action</th></tr></thead><tbody>` +
        this.marketData
          .map((s) => {
            const units = Math.floor(bal / s.p);
            const trendC =
              s.t === "High"
                ? "green-bg"
                : s.t === "Med"
                  ? "yellow-bg"
                  : "red-bg";
            return `<tr class="animate-fade">
                <td style="font-weight: 600;">${s.n}</td>
                <td style="color: var(--text-dim);">₹${s.p.toLocaleString()}</td>
                <td style="font-weight: 800; font-size: 16px;">${units} <span style="font-size: 10px; color: var(--text-dim);">UNITS</span></td>
                <td><span class="badge ${trendC}">${s.t}</span></td>
                <td><button class="btn-action btn-small" data-action="buy-asset" data-symbol="${s.n}" data-price="${s.p}" ${units < 1 ? "disabled" : ""}>Buy 1 Unit</button></td>
              </tr>`;
          })
          .join("") +
        `</tbody>`;
      this.renderPortfolio();
    }

    this.drawCharts();
    this.renderFullCalendar();
    this.validateTransactionAmount();
  }

  drawCharts() {
    const isLight =
      document.documentElement.getAttribute("data-theme") === "light";
    const colors = [
      "#7c3aed",
      "#d4af37",
      "#0ea5e9",
      "#e11d48",
      "#10b981",
      "#f97316",
    ];

    const ctx = document.getElementById("expenseChart").getContext("2d");
    ctx.clearRect(0, 0, 260, 260);
    let dataMap = {};
    this.currentUser.expenses
      .filter((e) => e.cat !== "Transfer" && e.cat !== "Income")
      .forEach((e) => {
        dataMap[e.cat] = (dataMap[e.cat] || 0) + e.amt;
      });
    const keys = Object.keys(dataMap);
    if (keys.length > 0) {
      const total = Object.values(dataMap).reduce((a, b) => a + b, 0);
      let currentAngle = -Math.PI / 2;
      keys.forEach((k, i) => {
        const sliceAngle = (dataMap[k] / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(130, 130, 95, currentAngle, currentAngle + sliceAngle);
        ctx.arc(130, 130, 60, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        currentAngle += sliceAngle;
      });
      ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "800 16px Inter";
      ctx.fillText("₹" + total.toLocaleString(), 130, 136);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ExpenseTrackerApp();
});

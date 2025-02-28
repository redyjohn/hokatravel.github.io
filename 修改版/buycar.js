// DOMContentLoaded 事件
// DOMContentLoaded 會在 HTML 結構被完全解析後觸發，但不會等到圖片、CSS、iframe 等資源載入完成。
// 這樣可以確保 JavaScript 操作 DOM 元素時，它們已經存在，而不會是 null。

document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript 已載入！");

    const stockData = {
        "2025-02-20": 15,
        "2025-02-21": 8,
        "2025-02-22": 2
    };

    let selectedDate = "2025-02-20"; // 預設日期
    let adultCount = 0;
    let childCount = 0;

    // 取得 DOM 元素
    const tourDateEl = document.getElementById("tour-date");
    const remainingSpotsEl = document.getElementById("remaining-spots");
    const adultCountEl = document.getElementById("adult-count");
    const childCountEl = document.getElementById("child-count");
    const totalCountEl = document.getElementById("total-count");
    const adultPriceEl = document.getElementById("adult-price");
    const childPriceEl = document.getElementById("child-price");
    const totalPriceEl = document.getElementById("total-price");

    if (!tourDateEl || !remainingSpotsEl) {
        console.error("HTML ID 對應錯誤，請檢查 HTML 結構！");
        return;
    }

    // 更新 UI
    function updateUI() {
        let availableSpots = stockData[selectedDate] || 0;
        let remainingSpots = availableSpots - (adultCount + childCount);

        console.log(`日期: ${selectedDate}, 剩餘名額: ${remainingSpots}`);

        remainingSpotsEl.textContent = remainingSpots >= 0 ? remainingSpots : "超過上限";
        adultCountEl.textContent = adultCount;
        childCountEl.textContent = childCount;
        totalCountEl.textContent = adultCount + childCount+"人";

        let adultPrice = adultCount * 6600;
        let childPrice = childCount * 6300;
        let totalPrice = adultPrice + childPrice;

        adultPriceEl.textContent = `${adultPrice}元`;
        childPriceEl.textContent = `${childPrice}元`;
        totalPriceEl.textContent = `${totalPrice}元`;
    }

    // 監聽日期變更
    tourDateEl.addEventListener("change", function () {
        selectedDate = this.value;
        adultCount = 0;
        childCount = 0;
        updateUI();
    });

    // 監聽 + / - 按鈕
    document.querySelectorAll(".increase, .decrease").forEach(button => {
        button.addEventListener("click", function () {
            const type = this.getAttribute("data-type");
            let availableSpots = stockData[selectedDate] || 0;

            if (this.classList.contains("increase")) {
                if (adultCount + childCount < availableSpots) {
                    if (type === "adult") adultCount++;
                    else if (type === "child") childCount++;
                }
            } else {
                if (type === "adult" && adultCount > 0) adultCount--;
                else if (type === "child" && childCount > 0) childCount--;
            }

            updateUI();
        });
    });

    // 預設顯示初始值
    selectedDate = tourDateEl.value || "2025-02-20";
    updateUI();
});

(() => {
    "use strict";

    const forms = document.querySelectorAll(".needs-validation");

    Array.from(forms).forEach((form) => {
        form.addEventListener("submit", (event) => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }

            form.classList.add("was-validated");
        }, false);
    });
})();

(() => {
    const taxSwitch = document.getElementById("switchCheckDefault");

    if (!taxSwitch) {
        return;
    }

    const updatePrices = (showTax) => {
        const basePrices = document.querySelectorAll(".base-price");
        const taxPrices = document.querySelectorAll(".tax-price");

        basePrices.forEach((price) => {
            price.style.display = showTax ? "none" : "inline";
        });

        taxPrices.forEach((price) => {
            price.style.display = showTax ? "inline" : "none";
        });
    };

    const savedPreference = localStorage.getItem("showTax");

    if (savedPreference === "true") {
        taxSwitch.checked = true;
        updatePrices(true);
    }

    taxSwitch.addEventListener("change", () => {
        localStorage.setItem("showTax", taxSwitch.checked);
        updatePrices(taxSwitch.checked);
    });
})();

(() => {
    const buttons = document.querySelectorAll(".save-stay-btn[data-listing-id]");

    if (!buttons.length) {
        return;
    }

    const renderButton = (button, isSaved) => {
        const icon = button.querySelector("i");

        button.classList.toggle("is-saved", isSaved);
        button.setAttribute("aria-pressed", String(isSaved));

        if (icon) {
            icon.classList.toggle("fa-solid", isSaved);
            icon.classList.toggle("fa-regular", !isSaved);
        }
    };

    buttons.forEach((button) => {
        button.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const listingId = button.dataset.listingId;

            try {
                const response = await fetch(`/listings/${listingId}/save`, {
                    method: "POST",
                    headers: { Accept: "application/json" }
                });

                if (response.redirected) {
                    // isLoggedIn middleware bounced this to /login
                    window.location.href = response.url;
                    return;
                }

                if (!response.ok) {
                    throw new Error("Save request failed");
                }

                const data = await response.json();

                if (!data.saved && button.dataset.removeOnUnsave === "true") {
                    const card = button.closest(".stay-card");
                    if (card) {
                        card.remove();
                    }
                    return;
                }

                renderButton(button, data.saved);
            } catch (error) {
                console.error("Could not update wishlist:", error);
            }
        });
    });
})();

(() => {
    const bookingForm = document.getElementById("bookingForm");

    if (!bookingForm) {
        return;
    }

    const nightlyPrice = Number(bookingForm.dataset.nightlyPrice || 0);
    const checkIn = document.getElementById("checkIn");
    const checkOut = document.getElementById("checkOut");
    const nightsLabel = document.getElementById("nightsLabel");
    const subtotalAmount = document.getElementById("subtotalAmount");
    const serviceFeeAmount = document.getElementById("serviceFeeAmount");
    const taxAmount = document.getElementById("taxAmount");
    const bookingTotal = document.getElementById("bookingTotal");
    const money = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    });

    const toDate = (value) => {
        if (!value) {
            return null;
        }

        return new Date(`${value}T00:00:00`);
    };

    const toInputDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    checkIn.min = toInputDate(today);
    checkOut.min = toInputDate(today);

    let unavailableRanges = [];
    try {
        unavailableRanges = JSON.parse(bookingForm.dataset.unavailableRanges || "[]")
            .map((range) => ({
                start: new Date(range.start),
                end: new Date(range.end),
            }));
    } catch (error) {
        unavailableRanges = [];
    }

    let errorMessage = bookingForm.querySelector(".booking-error");
    if (!errorMessage) {
        errorMessage = document.createElement("p");
        errorMessage.className = "booking-error";
        errorMessage.hidden = true;
        bookingForm.insertBefore(errorMessage, bookingForm.querySelector(".price-breakdown"));
    }

    const overlapsUnavailable = (start, end) => {
        return unavailableRanges.some((range) => start < range.end && end > range.start);
    };

    const showBookingError = (message) => {
        errorMessage.textContent = message;
        errorMessage.hidden = false;
    };

    const clearBookingError = () => {
        errorMessage.hidden = true;
    };

    const updateTotals = () => {
        const start = toDate(checkIn.value);
        const end = toDate(checkOut.value);
        let nights = 1;

        if (start && end && end > start) {
            nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        }

        if (start && end && end > start && overlapsUnavailable(start, end)) {
            showBookingError("Those dates overlap with an existing booking or a host-blocked date. Pick a different range.");
        } else {
            clearBookingError();
        }

        const subtotal = nightlyPrice * nights;
        const serviceFee = Math.round(subtotal * 0.12);
        const taxes = Math.round(subtotal * 0.18);
        const total = subtotal + serviceFee + taxes;

        nightsLabel.textContent = `${nights} night${nights === 1 ? "" : "s"}`;
        subtotalAmount.textContent = money.format(subtotal);
        serviceFeeAmount.textContent = money.format(serviceFee);
        taxAmount.textContent = money.format(taxes);
        bookingTotal.textContent = money.format(total);
    };

    bookingForm.addEventListener("submit", (event) => {
        const start = toDate(checkIn.value);
        const end = toDate(checkOut.value);

        if (start && end && overlapsUnavailable(start, end)) {
            event.preventDefault();
            showBookingError("Those dates overlap with an existing booking or a host-blocked date. Pick a different range.");
        }
    });

    checkIn.addEventListener("change", () => {
        const start = toDate(checkIn.value);

        if (start) {
            const nextDay = new Date(start);
            nextDay.setDate(start.getDate() + 1);
            checkOut.min = toInputDate(nextDay);

            const end = toDate(checkOut.value);

            if (end && end <= start) {
                checkOut.value = "";
            }
        }

        updateTotals();
    });

    checkOut.addEventListener("change", updateTotals);
})();

(() => {
    const shareButtons = document.querySelectorAll("[data-share-button]");

    shareButtons.forEach((button) => {
        button.addEventListener("click", async () => {
            const shareData = {
                title: document.title,
                url: window.location.href,
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                    return;
                }

                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(window.location.href);
                    const originalContent = button.innerHTML;
                    button.innerHTML = '<i class="fa-solid fa-check"></i> Copied';

                    window.setTimeout(() => {
                        button.innerHTML = originalContent;
                    }, 1600);
                }
            } catch (error) {
                return;
            }
        });
    });
})();
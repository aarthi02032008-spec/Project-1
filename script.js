/* =========================================================
   ALVENA WALLET
   Ethereum Sepolia Testnet
   Ethers.js v6
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const SEPOLIA_RPC =
    "https://ethereum-sepolia-rpc.publicnode.com";

const SEPOLIA_CHAIN_ID = 11155111;


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let provider = null;

let wallet = null;

let recoveryPhrase = [];

let verificationIndexes = [];

let encryptedWalletJson = null;


const STORAGE_KEY = "alvenaWallet";


function saveWalletToLocalStorage() {

    if (!wallet) return;


    const walletData = {

        address: wallet.address,

        privateKey: wallet.privateKey,

        publicKey: wallet.signingKey.publicKey,

        mnemonic: wallet.mnemonic.phrase

    };


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(walletData)
    );

}



function loadWalletFromLocalStorage() {

    const savedWallet = localStorage.getItem(STORAGE_KEY);

    if (!savedWallet) {
        return false;
    }

    return true;

}



function removeWalletFromLocalStorage(){

    localStorage.removeItem(
        STORAGE_KEY
    );

}


/* =========================================================
   INITIALIZE PROVIDER
========================================================= */

function initializeProvider() {

    try {

        provider =
            new ethers.JsonRpcProvider(
                SEPOLIA_RPC,
                {
                    chainId: SEPOLIA_CHAIN_ID,
                    name: "sepolia"
                }
            );

    } catch (error) {

        console.error(
            "Provider initialization failed:",
            error
        );

    }
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(page => {

        page.classList.remove(
            "active-page"
        );

    });


    const targetPage =
        document.getElementById(pageId);

    if (targetPage) {

        targetPage.classList.add(
            "active-page"
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


/* =========================================================
   CREATE WALLET FLOW
========================================================= */

function goToCreateWallet() {

    showPage("createPage");

}


/* =========================================================
   IMPORT PAGE
========================================================= */

function goToImportWallet() {

    document.getElementById(
        "importPhrase"
    ).value = "";

    clearMessage(
        "importMessage"
    );

    showPage("importPage");

}


/* =========================================================
   GENERATE WALLET
========================================================= */

function generateWallet() {

    try {

        initializeProvider();


        /*
         * Ethers creates a cryptographically random
         * HD wallet.
         */

        wallet =
            ethers.Wallet.createRandom();


        /*
         * Get the BIP-39 mnemonic phrase.
         */

        const phrase =
            wallet.mnemonic?.phrase;


        if (!phrase) {

            throw new Error(
                "Recovery phrase could not be generated."
            );

        }


        recoveryPhrase =
            phrase
                .trim()
                .toLowerCase()
                .split(/\s+/);


        /*
         * Safety check:
         * We specifically want 12 words.
         */

        if (recoveryPhrase.length !== 12) {

            throw new Error(
                "Generated recovery phrase is not 12 words."
            );

        }
    

        displayRecoveryPhrase();

        showPage("phrasePage");


    } catch (error) {

        console.error(error);

        showToast(
            "Unable to create wallet."
        );

    }

}

/* =========================================================
   CREATE WALLET PASSWORD
========================================================= */

async function createWalletPassword() {

    const password =
        document.getElementById("walletPassword").value;

    const confirmPassword =
        document.getElementById("confirmWalletPassword").value;

    const message =
        document.getElementById("passwordMessage");


    if (!password || !confirmPassword) {

        message.textContent =
            "Please enter your password.";

        return;
    }


    if (password !== confirmPassword) {

        message.textContent =
            "Passwords do not match.";

        return;
    }


    if (password.length < 8) {

        message.textContent =
            "Password must contain at least 8 characters.";

        return;
    }


    if (!wallet) {

        message.textContent =
            "Wallet not found. Please create the wallet again.";

        return;
    }


    try {

        message.textContent =
            "Encrypting wallet...";


        const encryptedWallet =
            await wallet.encrypt(password);


        localStorage.setItem(
            STORAGE_KEY,
            encryptedWallet
        );


        encryptedWalletJson =
            encryptedWallet;


        message.textContent =
            "Password created successfully.";


        setTimeout(() => {

            showWalletCreatedPage();

        }, 700);


    } catch (error) {

        console.error(error);

        message.textContent =
            "Unable to encrypt wallet.";

    }
}



/* =========================================================
   DISPLAY 12 WORDS
========================================================= */

function displayRecoveryPhrase() {

    const grid =
        document.getElementById(
            "phraseGrid"
        );


    grid.innerHTML = "";


    recoveryPhrase.forEach(
        (word, index) => {

            const wordBox =
                document.createElement(
                    "div"
                );

            wordBox.className =
                "phrase-word";


            wordBox.innerHTML = `
                <span class="phrase-number">
                    WORD ${index + 1}
                </span>

                <span class="phrase-text">
                    ${escapeHtml(word)}
                </span>
            `;


            grid.appendChild(
                wordBox
            );

        }
    );

}


/* =========================================================
   COPY RECOVERY PHRASE
========================================================= */

async function copyRecoveryPhrase() {

    if (!recoveryPhrase.length) {

        return;

    }


    const phrase =
        recoveryPhrase.join(" ");


    try {

        await navigator.clipboard.writeText(
            phrase
        );

        showToast(
            "Recovery phrase copied."
        );

    } catch (error) {

        showToast(
            "Copy failed. Please copy it manually."
        );

    }

}


/* =========================================================
   DOWNLOAD ENCRYPTED JSON
========================================================= */
function downloadEncryptedWallet() {

    if (!wallet) {
        alert("Wallet not available.");
        return;
    }

    const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.signingKey.publicKey,
        mnemonic:wallet.mnemonic.phrase
    };

    const json = JSON.stringify(walletData, null, 2);

    const blob = new Blob([json], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "alvena-wallet.json";

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const message = document.getElementById("saveWalletMessage");

    if (message) {
        message.textContent = "Wallet JSON downloaded successfully.";
        message.style.color = "#22C55E";
    }
}

/* =========================================================
   CONTINUE TO VERIFICATION
========================================================= */

function goToRecoveryVerification() {

    if (
        !wallet ||
        recoveryPhrase.length !== 12
    ) {

        showToast(
            "Create a wallet first."
        );

        return;

    }


    createVerificationQuestions();

    showPage("recoveryPage");

}


/* =========================================================
   RANDOM 3 WORD VERIFICATION
========================================================= */

function createVerificationQuestions() {

    const container =
        document.getElementById(
            "verificationInputs"
        );


    container.innerHTML = "";


    verificationIndexes = [];


    /*
     * Generate 3 unique random positions.
     */

    while (
        verificationIndexes.length < 3
    ) {

        const randomIndex =
            Math.floor(
                Math.random() * 12
            );


        if (
            !verificationIndexes.includes(
                randomIndex
            )
        ) {

            verificationIndexes.push(
                randomIndex
            );

        }

    }


    /*
     * Sort positions so the UI looks clean.
     */

    verificationIndexes.sort(
        (a, b) => a - b
    );


    verificationIndexes.forEach(
        (index, questionNumber) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "verification-item";


            item.innerHTML = `
                <label>
                    Word #${index + 1}
                </label>

                <input
                    type="text"
                    id="verify-${questionNumber}"
                    placeholder="Enter word"
                    autocomplete="off"
                    spellcheck="false"
                >
            `;


            container.appendChild(
                item
            );

        }
    );


    clearMessage(
        "verificationMessage"
    );

}


/* =========================================================
   CONFIRM RECOVERY PHRASE
========================================================= */

function confirmRecoveryPhrase() {

    if (
        !recoveryPhrase.length ||
        verificationIndexes.length !== 3
    ) {

        return;

    }


    let correct = true;


    verificationIndexes.forEach(
        (phraseIndex, questionIndex) => {

            const input =
                document.getElementById(
                    `verify-${questionIndex}`
                );


            const entered =
                input.value
                    .trim()
                    .toLowerCase();


            const expected =
                recoveryPhrase[
                    phraseIndex
                ];


            if (entered !== expected) {

                correct = false;

            }

        }
    );


    if (!correct) {

        showMessage(
            "verificationMessage",
            "One or more words are incorrect. Please try again.",
            false
        );

        return;

    }


    showMessage(
        "verificationMessage",
        "Recovery phrase verified successfully.",
        true
    );


    setTimeout(
        () => {

            showPage("passwordPage");

        },
        700
    );

}


/* =========================================================
   WALLET CREATED PAGE
========================================================= */

function showWalletCreatedPage() {

    if (!wallet) {

        return;

    }


    document.getElementById(
        "createdWalletAddress"
    ).textContent =
        wallet.address;


    showPage(
        "walletCreatedPage"
    );

}


/* =========================================================
   COPY CREATED ADDRESS
========================================================= */

async function copyCreatedAddress() {

    if (!wallet) {

        return;

    }


    await copyText(
        wallet.address
    );

}


/* =========================================================
   OPEN DASHBOARD
========================================================= */

async function openWalletDashboard() {

    if (!wallet) {

        showToast(
            "Wallet is not available."
        );

        return;

    }


    initializeProvider();


    wallet =
        wallet.connect(
            provider
        );


    updateDashboardAddress();


    showPage(
        "dashboardPage"
    );


    await refreshBalance();

}


/* =========================================================
   UPDATE DASHBOARD ADDRESS
========================================================= */

function updateDashboardAddress() {

    if (!wallet) {

        return;

    }


    document.getElementById(
        "dashboardAddress"
    ).textContent =
        wallet.address;

}


/* =========================================================
   REFRESH BALANCE
========================================================= */

async function refreshBalance() {

    if (!wallet) {

        return;

    }


    try {

        initializeProvider();


        const balance =
            await provider.getBalance(
                wallet.address
            );


        const formattedBalance =
            ethers.formatEther(
                balance
            );


        /*
         * Show a clean 3-decimal display.
         *
         * Example:
         * 0.000 ETH
         * 0.125 ETH
         */

        const displayBalance =
            Number(
                formattedBalance
            ).toFixed(3);


        document.getElementById(
            "dashboardBalance"
        ).textContent =
            `${displayBalance} ETH`;


    } catch (error) {

        console.error(
            "Balance error:",
            error
        );


        document.getElementById(
            "dashboardBalance"
        ).textContent =
            "0.000 ETH";


        showToast(
            "Unable to refresh balance."
        );

    }

}


/* =========================================================
   IMPORT WALLET
========================================================= */

function importWallet() {

    const textarea =
        document.getElementById(
            "importPhrase"
        );


    const phrase =
        textarea.value
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");


    if (!phrase) {

        showMessage(
            "importMessage",
            "Please enter your 12 recovery phrases.",
            false
        );

        return;

    }


    const words =
        phrase.split(" ");


    if (words.length !== 12) {

        showMessage(
            "importMessage",
            "Please enter exactly 12 words.",
            false
        );

        return;

    }


    try {

        /*
         * Validate BIP-39 checksum and word list.
         */

        if (
            !ethers.Mnemonic.isValidMnemonic(
                phrase
            )
        ) {

            throw new Error(
                "Invalid recovery phrase."
            );

        }


        initializeProvider();


        wallet =
            ethers.Wallet.fromPhrase(
                phrase
            );


        recoveryPhrase =
            words;


        wallet =
            wallet.connect(
                provider
            );
    


        showMessage(
            "importMessage",
            "Wallet imported successfully.",
            true
        );


        setTimeout(
            () => {

                updateDashboardAddress();

                showPage(
                    "dashboardPage"
                );

                refreshBalance();

            },
            700
        );


    } catch (error) {

        console.error(error);

        showMessage(
            "importMessage",
            "Invalid recovery phrase. Please check all 12 words.",
            false
        );

    }

}


/* =========================================================
   SEND PANEL
========================================================= */

function openSendPanel() {

    if (!wallet) {

        return;

    }


    document.getElementById(
        "recipientAddress"
    ).value = "";


    document.getElementById(
        "sendAmount"
    ).value = "";


    clearMessage(
        "sendMessage"
    );


    document.getElementById(
        "sendPanel"
    ).classList.add(
        "active"
    );

}


function closeSendPanel() {

    document.getElementById(
        "sendPanel"
    ).classList.remove(
        "active"
    );

}


/* =========================================================
   SEND ETH
========================================================= */

async function sendETH() {

    if (!wallet) {

        return;

    }


    const recipient =
        document.getElementById(
            "recipientAddress"
        ).value.trim();


    const amount =
        document.getElementById(
            "sendAmount"
        ).value.trim();


    if (
        !ethers.isAddress(
            recipient
        )
    ) {

        showMessage(
            "sendMessage",
            "Please enter a valid Ethereum address.",
            false
        );

        return;

    }


    if (!amount) {

        showMessage(
            "sendMessage",
            "Please enter an ETH amount.",
            false
        );

        return;

    }


    let value;


    try {

        value =
            ethers.parseEther(
                amount
            );

    } catch (error) {

        showMessage(
            "sendMessage",
            "Invalid ETH amount.",
            false
        );

        return;

    }


    if (
        value <= 0n
    ) {

        showMessage(
            "sendMessage",
            "Amount must be greater than 0.",
            false
        );

        return;

    }


    try {

        showMessage(
            "sendMessage",
            "Preparing transaction...",
            true
        );


        /*
         * Make sure wallet is connected to provider.
         */

        wallet =
            wallet.connect(
                provider
            );


        const balance =
            await provider.getBalance(
                wallet.address
            );


        if (
            value >= balance
        ) {

            showMessage(
                "sendMessage",
                "Insufficient balance for this transaction and gas.",
                false
            );

            return;

        }


        const transaction =
            await wallet.sendTransaction({
                to: recipient,
                value: value
            });


        showMessage(
            "sendMessage",
            "Transaction submitted. Waiting for confirmation...",
            true
        );


        await transaction.wait();


        showMessage(
            "sendMessage",
            "Transaction confirmed successfully.",
            true
        );


        showToast(
            "ETH sent successfully."
        );


        await refreshBalance();


        setTimeout(
            () => {

                closeSendPanel();

            },
            1200
        );


    } catch (error) {

        console.error(
            "Transaction failed:",
            error
        );


        let errorMessage =
            "Transaction failed.";


        if (
            error.code ===
            "INSUFFICIENT_FUNDS"
        ) {

            errorMessage =
                "Insufficient Sepolia ETH for gas.";

        }


        showMessage(
            "sendMessage",
            errorMessage,
            false
        );

    }

}


/* =========================================================
   RECEIVE PANEL
========================================================= */

function openReceivePanel() {

    if (!wallet) {

        return;

    }


    document.getElementById(
        "receiveAddress"
    ).textContent =
        wallet.address;


    document.getElementById(
        "receivePanel"
    ).classList.add(
        "active"
    );

}


function closeReceivePanel() {

    document.getElementById(
        "receivePanel"
    ).classList.remove(
        "active"
    );

}


/* =========================================================
   COPY DASHBOARD ADDRESS
========================================================= */

async function copyDashboardAddress() {

    if (!wallet) {

        return;

    }


    await copyText(
        wallet.address
    );

}


/* =========================================================
   COPY RECEIVE ADDRESS
========================================================= */

async function copyReceiveAddress() {

    if (!wallet) {

        return;

    }


    await copyText(
        wallet.address
    );

}


/* =========================================================
   GENERAL COPY
========================================================= */

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(
            text
        );

        showToast(
            "Copied successfully."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Copy failed."
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logoutWallet() {

    /*
     * Remove wallet references from memory.
     *
     * The encrypted JSON file downloaded earlier
     * remains on the user's device.
     */
    removeWalletFromLocalStorage();
    wallet = null;

    provider = null;

    recoveryPhrase = [];

    verificationIndexes = [];

    encryptedWalletJson = null;


    document.getElementById(
        "dashboardBalance"
    ).textContent =
        "0.000 ETH";


    document.getElementById(
        "dashboardAddress"
    ).textContent =
        "-";


    closeSendPanel();

    closeReceivePanel();


    showToast(
        "Wallet logged out."
    );


    setTimeout(
        () => {

            showPage(
                "welcomePage"
            );

        },
        500
    );

}

/* =========================================================
   UNLOCK WALLET
========================================================= */

async function unlockWallet() {

    const password =
        document.getElementById("unlockPassword").value;

    const message =
        document.getElementById("unlockMessage");

    if (!password) {

        message.textContent =
            "Please enter your password.";

        return;

    }

    try {

        const encryptedWallet =
            localStorage.getItem(STORAGE_KEY);

        initializeProvider();

        wallet =
            await ethers.Wallet.fromEncryptedJson(
                encryptedWallet,
                password
            );

        wallet =
            wallet.connect(provider);

        updateDashboardAddress();

        showPage("dashboardPage");

        refreshBalance();

    } catch (error) {

        console.error(error);

        message.textContent =
            "Incorrect password.";

    }

}
/* =========================================================
   MESSAGE HELPERS
========================================================= */

function showMessage(
    elementId,
    message,
    success = true
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.style.color =
        success
            ? "#22C55E"
            : "#F87171";

}


function clearMessage(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            "";

    }

}


function showSaveMessage(
    message,
    success
) {

    showMessage(
        "saveWalletMessage",
        message,
        success
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return value
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   CLOSE MODALS WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const encryptedWallet =
            localStorage.getItem(STORAGE_KEY);

        if (encryptedWallet) {

            showPage("unlockPage");

        } else {

            showPage("welcomePage");

        }

    }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeSendPanel();

            closeReceivePanel();

        }

    }
);


/* =========================================================
   START APP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function(){

        initializeProvider();

    const walletExists = loadWalletFromLocalStorage();

    if (walletExists) {

         showPage("unlockPage");

    } else {

        showPage("welcomePage");

    }

          
    }
);
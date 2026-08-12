const server = "https://snsaver-render-api.onrender.com";

const searchButton = document.getElementById("search-button");
searchButton.addEventListener("click", async () => {
    initialize();

    let username;
    const usernameInput = document.getElementById("username-input");
    try {
        const url = new URL(usernameInput.value);
        if (url.hostname === "www.instagram.com") {
            username = url.pathname.split("/")[1];
        }
    } catch {
        username = usernameInput.value;
    }

    if (!username) {
        const errorMessage = document.getElementById("error-message");
        errorMessage.classList.remove("hidden");
        errorMessage.innerHTML =
            "Please enter an Instagram username or profile URL.";
        return;
    }

    let imagesFlag = false;
    let videosFlag = false;
    let reelsFlag = false;

    const mediaTypeAll = document.getElementById("media-type-all");
    if (mediaTypeAll.checked) {
        imagesFlag = true;
        videosFlag = true;
        reelsFlag = true;
    }

    const mediaTypeImages = document.getElementById("media-type-images");
    if (mediaTypeImages.checked) {
        imagesFlag = true;
    }

    const mediaTypeVideos = document.getElementById("media-type-videos");
    if (mediaTypeVideos.checked) {
        videosFlag = true;
    }

    const mediaTypeReels = document.getElementById("media-type-reels");
    if (mediaTypeReels.checked) {
        reelsFlag = true;
    }

    const response = await getPorfile(
        username,
        imagesFlag,
        videosFlag,
        reelsFlag,
    );

    const data = await displayProfile(response);

    if (!checkProfile(data)) {
        return;
    }

    checkJob(data.id);
});

function initialize() {
    const loading = document.getElementById("loading");
    loading.classList.add("hidden");

    const errorMessage = document.getElementById("error-message");
    errorMessage.innerHTML = "";
    errorMessage.classList.add("hidden");

    const downloadButton = document.getElementById("download-button");
    downloadButton.disabled = false;
    downloadButton.classList.add("hidden");

    const user = document.getElementById("user");
    user.innerHTML = "";
    user.classList.remove("user-success");
    user.classList.remove("user-error");
}

async function getPorfile(username, imagesFlag, videosFlag, reelsFlag) {
    const loading = document.getElementById("loading");
    const loadingMessage = document.getElementById("loading-message");
    loadingMessage.innerHTML = "Checking user...";
    loading.classList.remove("hidden");

    const response = await fetch(`${server}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username,
            imagesFlag,
            videosFlag,
            reelsFlag,
        }),
    });

    loading.classList.add("hidden");
    return response;
}

async function displayProfile(response) {
    const user = document.getElementById("user");

    const status = response.status;
    const json = await response.json();
    const data = json.data;
    const message = json.message;

    if (status !== 200) {
        user.classList.remove("user-success");
        user.classList.add("user-error");
        user.innerHTML = `
            <p class="user__error">${message}</p>
        `;
        return;
    }

    user.classList.remove("user-error");
    user.classList.add("user-success");

    const profile = data.profile;
    const id = data.id;
    const url = data.url;
    user.innerHTML = `
        <a class="user__link" href="https://www.instagram.com/${profile.username}" target="_blank">
            <div class="user__image-area">
                <img src="${url}" class="user__image"></img>
            </div>
            <div class="user__prolile-area">
                <p class="user__username">${profile.username}</p>
                <p class="user__fullname">${profile.full_name}</p>
                <p class="user__count"><span>${profile.count}</span> posts</p>
                ${profile.is_private ? '<p class="user__private">private account</p>' : ""}
            </div>
        </a>
    `;

    return { id, profile };
}

function checkProfile(data) {
    const errorMessage = document.getElementById("error-message");
    if (!data.profile) {
        errorMessage.classList.remove("hidden");
        return false;
    }

    if (data.profile.is_private) {
        errorMessage.classList.remove("hidden");
        errorMessage.innerHTML = `
            Can't download because the account is private.
        `;
        return false;
    }

    return true;
}

async function checkJob(id) {
    const loading = document.getElementById("loading");
    const loadingMessage = document.getElementById("loading-message");
    const errorMessage = document.getElementById("error-message");

    loadingMessage.innerHTML = "Waiting in queue... Please wait.";
    loading.classList.remove("hidden");

    const downloadButton = document.getElementById("download-button");
    let catchcount = 0;
    while (true) {
        try {
            const response = await fetch(`${server}/api/status/${id}`);
            const json = await response.json();
            const status = json.status;

            if (!status) {
                loading.classList.add("hidden");
                errorMessage.innerHTML = "An unexpected error occurred.";
                errorMessage.classList.remove("hidden");
                break;
            }

            if (status === "FAILED") {
                loading.classList.add("hidden");
                errorMessage.innerHTML = "An unexpected error occurred.";
                errorMessage.classList.remove("hidden");
                break;
            }

            if (status === "COMPLETED") {
                loading.classList.add("hidden");
                downloadButton.classList.remove("hidden");
                downloadButton.onclick = () => {
                    downloadButton.disabled = true;
                    window.location.href = `${json.url}`;
                };
                break;
            }

            if (status === "RUNNING") {
                loadingMessage.innerHTML = "Preparing download... Please wait.";
            }

            catchcount = 0;

            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch {
            count += 1;
            if (count === 3) {
                errorMessage.innerHTML = "An unexpected error occurred.";
                errorMessage.classList.remove("hidden");
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
    return;
}

const contactFormButton = document.getElementById("contact-form-button");
contactFormButton.addEventListener("click", async () => {
    const form = document.getElementById("contact-from");
    const name = form.name.value;
    const mail = form.mail.value;
    const message = form.message.value;
    const datetime = new Date();

    fetch(`${server}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            mail,
            message,
            datetime,
        }),
    });
});

const server = "https://snsaver-render-api.onrender.com";
const searchButton = document.getElementById("search-button");
const usernameInput = document.getElementById("username-input");
const mediaTypeAll = document.getElementById("media-type-all");
const mediaTypeImages = document.getElementById("media-type-images");
const mediaTypeVideos = document.getElementById("media-type-videos");

searchButton.addEventListener("click", async () => {
    resetUI();
    const username = usernameInput.value;
    let imagesFlag = false;
    let videosFlag = false;

    if (mediaTypeAll.checked) {
        imagesFlag = true;
        videosFlag = true;
    }

    if (mediaTypeImages.checked) {
        imagesFlag = true;
        videosFlag = false;
    }

    if (mediaTypeVideos.checked) {
        imagesFlag = false;
        videosFlag = true;
    }

    const response = await getPorfile(username, imagesFlag, videosFlag);

    const data = await displayProfile(response);
    if (!checkProfile(data)) {
        return;
    }
    checkJob(data.id);
});

function resetUI() {
    const loading = document.getElementById("loading");
    loading.classList.add("hidden");

    const errorMessage = document.getElementById("error-message");
    errorMessage.classList.add("hidden");

    const downloadButton = document.getElementById("download-button");
    downloadButton.disabled = false;
    downloadButton.classList.add("hidden");

    const user = document.getElementById("user");
    user.classList.remove("user-success");
    user.classList.remove("user-error");
    user.innerHTML = "";
}

async function getPorfile(username, imagesFlag, videosFlag) {
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
    const download = document.getElementById("download");
    if (!data.profile) {
        console.error("Unexpected profile data:", data);
        download.innerHTML = `
            <p>An unexpected error occurred.</p>
        `;
        return false;
    }

    if (data.profile.is_private) {
        download.innerHTML = `
            <p>Can't download because the account is private.</p>
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
                errorMessage.classList.remove("hidden");
                break;
            }

            if (status === "FAILED") {
                loading.classList.add("hidden");
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
                errorMessage.classList.remove("hidden");
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
    return;
}

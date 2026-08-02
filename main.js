const server = "https://snsaver-api.onrender.com";
const searchButton = document.getElementById("search__button");
const usernameInput = document.getElementById("search__input-username");

searchButton.addEventListener("click", async () => {
    resetUI();
    const username = usernameInput.value;
    const response = await getPorfile(username);
    const data = await displayProfile(response);
    if (!checkProfile(data)) {
        return;
    }
    checkJob(data.id);
});

function resetUI() {
    const spinner = document.getElementById("spinner");
    spinner.classList.add("hidden");

    const downloadButton = document.getElementById("download__button");
    downloadButton.classList.add("hidden");

    const user = document.getElementById("user");
    user.innerHTML = "";
}

async function getPorfile(username) {
    spinner = document.getElementById("spinner");
    spinner.classList.remove("hidden");

    const response = await fetch(`${server}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username }),
    });

    spinner.classList.add("hidden");
    return response;
}

async function displayProfile(response) {
    const user = document.getElementById("user");

    if (response.status === 404) {
        user.classList.remove("user-success");
        user.classList.add("user-error");
        user.innerHTML = `
            <p class="user__not-found">user not found</p>
        `;
        return;
    }

    if (response.status !== 200) {
        user.classList.remove("user-success");
        user.classList.add("user-error");
        user.innerHTML = `
            <p class="user__error">internal server error</p>
        `;

        return;
    }

    user.classList.remove("user-error");
    user.classList.add("user-success");
    const json = await response.json();
    const profile = json.data.profile;
    const id = json.data.id;
    user.innerHTML = `
        <a class="user__link" href="https://www.instagram.com/${profile.username}" target="_blank">
            <img class="user__image" src="${profile.url}"></img>
            <div class="user__prolile">
                <p class="user__username" >${profile.username}</p>
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
    const spinner = document.getElementById("spinner");
    spinner.classList.remove("hidden");
    const downloadButton = document.getElementById("download__button");
    while (true) {
        const response = await fetch(`${server}/api/status/${id}`);
        const json = await response.json();
        const status = json.status;

        if (status === "FAILED") {
            spinner.classList.add("hidden");
            break;
        }

        if (status === "COMPLETED") {
            spinner.classList.add("hidden");
            downloadButton.classList.remove("hidden");
            downloadButton.onclick = () => {
                downloadButton.disabled = true;
                window.location.href = `${json.url}`;
            };
            break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return;
}

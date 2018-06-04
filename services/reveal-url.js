/**
 * Return the final destination URL from the shortened URL
 *
 * @param {*} shortenedUrl
 * @returns
 */
function revealUrl(shortenedUrl) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = event => {
            if (event.target.readyState == 2) {
                if (event.target.status == 200) {
                    resolve(event.target.responseURL);
                }
            }
        }
        xhr.open('HEAD', shortenedUrl, true);
        xhr.send();
    });
}

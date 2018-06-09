/**
 * Return the final destination URL from the shortened URL
 *
 * @param {*} sourceUrl
 * @returns
 */
function requestUrl(sourceUrl) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = event => {
            if (event.target.readyState == 2) {
                if (event.target.status == 200) {
                    resolve(event.target.responseURL);
                }
            }
        };
        xhr.open('HEAD', sourceUrl, true);
        xhr.send();
    });
}

# PCBvalues

## What is PCBvalues
[![Reddit](https://img.shields.io/badge/r%2FPolcompball-Reddit-%23FF4500?style=flat&logo=reddit)](https://www.reddit.com/r/Polcompball/)
[![Wiki](https://img.shields.io/badge/Polcompball-Wiki-%230000?style=flat&logo=wikipedia)](https://polcompball.net/wiki/)
[![Discord](https://img.shields.io/badge/Polcompball-Server-%235865F2?style=flat&logo=discord)
](https://discord.gg/JA3Qz5ZTX6)

PCBvalues is a test for what kind of member of the political community you are and what camps you fall into. It is inspired by the personalities of the Polcompball community

## Where are the old versions of PCBvalues?
The original version is available on [this link](https://polcompballvalues.github.io/legacy/) with the code hosted on [this repository](https://github.com/Polcompballvalues/legacy).

The 2.0 version is available on [this link](https://polcompballvalues.github.io/) with the code hosted on [this repository](https://github.com/Polcompballvalues/polcompballvalues.github.io).

## Where can I see which users I can get matched with if I take the test?
You can see the current available user scores in the [user gallery](https://pcbvalues.github.io/gallery.html).

## How do I get added to the user gallery?
You can be added by taking the test and selecting the "Submit Your Scores" option at the bottom of the page, this will take you to a page with a text box and a "Send" button, simply enter the name you want to be added as to the test and click the send button.

Alternatively you can send an HTTP POST request to the address <https://pcbvalues.pcbvalues.workers.dev/api/v3> with a JSON payload similar to the shown below:
```json
{
    "name" : "Your name",
    "edition" : "s or f",
    "version" : "The version of the test you took",
    "time": "ISO formatted time string of the time you took the test",
    "vals" : [
        50,
        50,
        50,
        50,
        50,
        50,
        50
    ]
}
```
A successful submition will return a json containing `{"success":true}`, an invalid score or an error submitting the score will return an HTTP error code with the text `{"status": 500, "message": "your error message"}`.


## Who worked on this test?
You can see the full list of involved members in the [credits](https://pcbvalues.github.io/credits.html) page.

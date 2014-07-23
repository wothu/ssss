# SSSS

SSSS is a static file server that make it easier to start a web service. It's very simple. And with
its route feature, it could be very useful.

## Installation

    $ npm install -g ssss

## Basic Usage

Enter the folder where you put your webpages in. And just type `ssss` to start the server. Of course
all the static assets under the folder can be accessed by your browser, too.

    $ cd ~/hello
    $ ssss 
    Server started at 127.0.0.1:8080

Open your browser and type `127.0.0.1:8080/` plus your file name, you will see your page!

If your file is `index.html` or `index.htm` and it's under the root directory where you run ssss,
the file name can be omitted.

Press ctrl-c to stop the server.

## Configuration

You can customize hostname and port by just add them after the `ssss` command. All of the following 
are acceptable (on condition that mydomain can be resolved to your machine):
    
    $ ssss 8081
    $ ssss mydomain
    $ ssss mydomain:8081

By Default, SSSS is using 127.0.0.1:8080 as hostname and port.

### Route file

Using route file, you can specify the reponse file for a specific url pattern. That give you 
ability to handle a virtual folder in the url, and to mock json response for AJAX call, etc.

Route file is a JSON file and it MUST have a .json extension name. All of the following are
acceptable:

    $ ssss route.json
    $ ssss 8081 ../route.json
    $ ssss ~/route.json mydomain:8081

The content of route file should be a JSON object, which uses the url pattern as key and file path
as value.

    {
        "/" : "default.html",
        "/foo/" : "../foo.html",
        "/bar.jpeg" : "img/bar.jpg",
        "/getuserinfo?id=10" : "~/mockfiles/user10.json"
    }

HINTS:

- You must add '/' at the front of the key, which indicates it's a absolute path.

- The last '/' in the key do take effect, which mean `"/foo"` and `"/foo/"` will be regard as two
different path.

- The file path is relative to the folder that SSSS is run. However, you can also specify the files
that is out of the folder, while normally the server can only access the files that is under the
current working directory.

- If query string (the part after '?') is not provided in the route file, requests contains any
query string will return the relevant file just as no query string in the request.

- Currently we do NOT support regular expression as url pattern.
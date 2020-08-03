// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

const n = 1;

$(document).ready(function () {
    var db;
    var request = window.indexedDB.open("BookDB", 2);
    let forms = $(".bookSubmit");

    request.onerror = function (event) {
        console.log("Please allow IndexedDB!");
    };
    request.onsuccess = function (event) {
        db = event.target.result;
        var booksCached = false;
        console.log("Checking for cached books...");
        var bookStore = db.transaction("Books").objectStore("Books");
        bookStore.openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                booksCached = true;
                var book = cursor.value;
                let rq = createPutPostRequest(book);
                addRequestToDb(rq);
                createBookElement(book.name, book.description, book.author, book.pages, book.id).appendTo($("#main-storage"));
                cursor.continue();
            }
            else {
                if (!booksCached) {
                    console.log("No cached data found.");
                    getAllBooks();
                }
            }
        }
        console.log("Setting sync interval of " + n + " minutes.");
        setInterval(serverSync,n * 60 * 1000);
    };

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        db.createObjectStore("Books", { keyPath: "id" });
        db.createObjectStore("Requests", {autoIncrement: true});
    }

    $("#main-storage").on("click", ".delete-btn", function (event) {
        var deleteRequest = {
            url: `/api/${event.target.value}`,
            type: "DELETE",
            dataType: "json",
            data: ""
        }
        addRequestToDb(deleteRequest);

        db.transaction(["Books"], "readwrite").objectStore("Books").delete(Number(event.target.value));

        $(event.target).parent().parent().remove();
    })

    function addRequestToDb(Request) {
        var transaction = db.transaction("Requests", "readwrite");
        transaction.objectStore("Requests").add(Request);
    }

    function createBookCache(Book) {
        var transaction = db.transaction("Books", "readwrite"); 
        transaction.objectStore("Books").add(Book);
    }

    function acceptFromForm() {
        var Book = {};
        Book.name = $("#NameInput").val();
        Book.id = Number($("#IdInput").val());
        Book.description = $("#DescriptionInput").val();
        Book.author = $("#AuthorInput").val();
        Book.pages = Number($("#PagesInput").val());
        $('#staticBackdrop').modal(`hide`);
        for (var i = 0; i < 5; i++) forms[i].value = "";
        return Book;
    }

    function createPutPostRequest(Book) {
        var Request = {};
        Request.type = "POST";
        Request.url = "/api/";
        Request.dataType = "json";
        Request.data = JSON.stringify(Book);
        Request.contentType = "application/json; charset=utf-8";
        return Request;
    }

    $("#SubmitBook").on("click", function () {
        let formsChecked = true;
        
        for (var i = 0; i < 5; i++) {
                if (forms[i].value) {
                } else {
                    formsChecked = false;
                };
        }
        if (formsChecked) {
            Book = acceptFromForm();
            createBookElement(Book.name, Book.description, Book.author, Book.pages, Book.id).appendTo($("#main-storage"));
            createBookCache(Book);
            let rq = createPutPostRequest(Book);
            addRequestToDb(rq);
        }
        else alert("Please fill all the forms before submitting!");
    })

    function fillBody(data) {
        clearBody();
        for (var i in data) {
    
            createBookElement(data[i]['name'], data[i]['description'], data[i]['author'], data[i]['pages'], data[i]['id']).appendTo($("#main-storage"));
        }
    }

    function createBookElement(name, description, author, pages, id) {
        let newElement = $(`<div class=\"container col-lg-3 col-md-6 col-sm-12 border book-element\" value=\"${id}\">`);
        let firstDiv = $("<div class=\"container-fluid px-0 mt-3\">");
        firstDiv.append($("<button class=\"btn btn-outline-danger float-right delete-btn\">").val(id).html("X"));
        firstDiv.append($("<h4>").html("Name: " + name));
        let secondDiv = ($("<div class=\"text-body\">"));
        secondDiv.append($("<p>").html("Description: " + description));
        secondDiv.append($("<p>").html("Author: " + author));
        secondDiv.append($("<p class = \"small\">").html("Pages: " + pages));
        newElement.append(firstDiv, secondDiv);
        return newElement;
    }

    function clearBody() {
        $("#main-storage").children().remove();
    }

    function serverSync() {
        console.log("Starting server sync...");
        var requestsProcessed = 0;

        var transaction = db.transaction(["Requests"], "readwrite");;
        var requestStore = transaction.objectStore("Requests");
        requestStore.openCursor().onsuccess = function (event) {
            cursor = event.target.result;
            if (cursor) {
                console.log("Sending request to server: ");
                console.log(cursor.value);
                requestsProcessed++;
                $.ajax(cursor.value);
                cursor.continue();
            }
            else {
                console.log("All of the requests are processed, clearing the store.");
                requestStore.clear();
                if (requestsProcessed) console.log("Server sync finished, requests processed: " + requestsProcessed);
            }
        }
    }

    function getAllBooks() {
        $.ajax({
            url: "/api/",
            type: "GET",
            dataType: "json"
        }).done(function (request) {
            console.log("Fetched all books from the server");
            console.log(request);
            var transaction = db.transaction(["Books"], "readwrite");
            var bookStore = transaction.objectStore("Books");
            bookStore.clear();
            for (var i in request) {
                bookStore.add(request[i]);
            }
            fillBody(request);
        }).fail(function () {
            console.log("Heap fetching failed");
        })
    }

})


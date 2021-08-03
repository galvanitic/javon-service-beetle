"use strict";
exports.__esModule = true;
// import express from 'express';
var app_1 = require("firebase/app");
require("firebase/database");
var unirest_1 = require("unirest");
var fb_cred_1 = require("./galvanite/fb-cred");
var rapi_cred_1 = require("./galvanite/rapi-cred");
app_1["default"].initializeApp(fb_cred_1["default"]);
var database = app_1["default"].database();
// let usrID:string = '1419097858';
// let customHashtag:string = 'javondesigns';
var usrID = '369469525';
var customHashtag = 'galvanite';
var updateData = function (postsArr) {
    var PostData = {
        fname: "Javon",
        lname: "Saucedo",
        instagram: {
            usr_id: usrID,
            posts: postsArr
        }
    };
    app_1["default"].database().ref('users/' + fb_cred_1["default"].fbKey).set(PostData, function (error) {
        if (error) {
            console.log(error);
        }
        else {
            console.log('Data saved successfully!');
        }
    })["catch"](function (err) { return console.log(err); });
};
var fetchWritePosts = function () {
    var data;
    var postsArr = [];
    unirest_1["default"].get(rapi_cred_1["default"].url)
        .query({
        "hash_tag": customHashtag
    })
        .headers({
        "x-rapidapi-key": rapi_cred_1["default"].xRapidApiKey,
        "x-rapidapi-host": rapi_cred_1["default"].xRapidApiHost,
        "useQueryString": true
    })
        .then(function (res) {
        if (res.error)
            throw new Error(res.error);
        data = res.body;
        console.log(data);
        var jsonData = JSON.parse(data);
        if (jsonData.data !== undefined) {
            for (var i = 0; i < Number(jsonData.data.hashtag.edge_hashtag_to_media.edges.length) - 1; i++) {
                if (jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node !== undefined) {
                    var postNodeData = {
                        post: {
                            owner: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.owner.id,
                            shortcode: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.shortcode,
                            display_url: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.shortcode,
                            thumbnail_src: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.display_url,
                            caption: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.edge_media_to_caption.edges[0].node.text
                        }
                    };
                    if (jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.owner.id == usrID) {
                        console.log("Post #" + i + " was added.");
                        postsArr.push(postNodeData);
                    }
                    else {
                        console.log("Post #" + i + " does not belong to user.");
                    }
                }
            }
        }
        else {
            console.log("#" + customHashtag + " is empty.");
        }
        updateData(postsArr);
    })["catch"](function (err) { return console.log(err); });
};
var serviceBeetle = function () {
    database.ref('users/' + fb_cred_1["default"].fbKey).remove();
    fetchWritePosts();
};
serviceBeetle();
setInterval(serviceBeetle, (1000 * 60 * 60) * 5); // Repeat every 5 hrs
// setInterval(serviceBeetle, 30000) // Repeat every 30 seconds

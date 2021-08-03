"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import express from 'express';
const app_1 = __importDefault(require("firebase/app"));
require("firebase/database");
const unirest_1 = __importDefault(require("unirest"));
const fb_cred_1 = __importDefault(require("./galvanite/fb-cred"));
const rapi_cred_1 = __importDefault(require("./galvanite/rapi-cred"));
const axios_1 = __importDefault(require("axios"));
app_1.default.initializeApp(fb_cred_1.default);
let database = app_1.default.database();
// let usrID:string = '1419097858';
// let customHashtag:string = 'javondesigns';
let usrID = '369469525';
let customHashtag = 'galvanite';
let updateData = (postsArr) => {
    let PostData = {
        fname: "Javon",
        lname: "Saucedo",
        instagram: {
            usr_id: usrID,
            posts: postsArr
        }
    };
    app_1.default.database().ref('users/' + fb_cred_1.default.fbKey).set(PostData, function (error) {
        if (error) {
            console.log(error);
        }
        else {
            console.log('Data saved successfully!');
        }
    }).catch(err => console.log(err));
};
let fetchWritePosts1 = () => {
    let data;
    let postsArr = [];
    unirest_1.default.get(rapi_cred_1.default.url)
        .query({
        "hash_tag": customHashtag
    })
        .headers({
        "x-rapidapi-key": rapi_cred_1.default.xRapidApiKey,
        "x-rapidapi-host": rapi_cred_1.default.xRapidApiHost,
        "useQueryString": true
    })
        .then((res) => {
        if (res.error)
            throw new Error(res.error);
        console.log(res.body);
        data = res.body;
        let jsonData = JSON.parse(data);
        if (jsonData.data !== undefined) {
            for (let i = 0; i < Number(jsonData.data.hashtag.edge_hashtag_to_media.edges.length) - 1; i++) {
                if (jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node !== undefined) {
                    let postNodeData = {
                        post: {
                            owner: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.owner.id,
                            shortcode: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.shortcode,
                            display_url: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.shortcode,
                            thumbnail_src: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.display_url,
                            caption: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.edge_media_to_caption.edges[0].node.text
                        }
                    };
                    if (jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.owner.id == usrID) {
                        console.log(`Post #${i} was added.`);
                        postsArr.push(postNodeData);
                    }
                    else {
                        console.log(`Post #${i} does not belong to user.`);
                    }
                }
            }
        }
        else {
            console.log(`#${customHashtag} is empty.`);
        }
        updateData(postsArr);
    }).catch((err) => console.log(err));
};
let fetchWritePosts = () => {
    let data;
    let postsArr = [];
    var options = {
        method: 'GET',
        url: `https://instagram85.p.rapidapi.com/account/${usrID}/feed`,
        params: { hash_tag: customHashtag },
        headers: {
            'x-rapidapi-key': rapi_cred_1.default.xRapidApiKey,
            'x-rapidapi-host': rapi_cred_1.default.xRapidApiHost
        }
    };
    axios_1.default.request(options).then(function (response) {
        let posts = response.data.data;
        for (let i = 0; i < posts.length - 1; i++) {
            console.log();
            let caption = posts[i].caption;
            let postNodeData = {
                post: {
                    owner: posts[i].owner_id,
                    shortcode: posts[i].short_code,
                    display_url: posts[i].post_url,
                    thumbnail_src: posts[i].images.thumbnail,
                    caption: caption
                }
            };
            if (caption.includes(`#${customHashtag}`)) {
                // console.log(`Post ${posts[i].short_code} was added.`);
                console.log(postNodeData);
                postsArr.push(postNodeData);
            }
            else {
                console.log(`Post #${i} does not belong to user.`);
            }
        }
        updateData(postsArr);
    })
        .catch(function (error) {
        console.error(error);
    });
};
let serviceBeetle = () => {
    database.ref('users/' + fb_cred_1.default.fbKey).remove();
    fetchWritePosts();
};
serviceBeetle();
setInterval(serviceBeetle, (1000 * 60 * 60) * 5); // Repeat every 5 hrs
// setInterval(serviceBeetle, 30000) // Repeat every 30 seconds

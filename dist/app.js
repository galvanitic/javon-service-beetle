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
app_1.default.initializeApp(fb_cred_1.default);
let database = app_1.default.database();
// let usrID:string = '1419097858';
let usrID = '369469525';
let customHashtag = 'galvanite';
// let customHashtag:string = 'javondesigns';
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
    });
};
let fetchWritePosts = () => {
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
        data = res.body;
        let jsonData = JSON.parse(data);
        for (let i = 0; i < Number(jsonData.data.hashtag.edge_hashtag_to_media.edges.length) - 1; i++) {
            if (jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node !== undefined) {
                let postNodeData = {
                    post: {
                        owner: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.owner.id,
                        shortcode: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.shortcode,
                        display_url: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.shortcode,
                        thumbnail_src: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.thumbnail_src,
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
        updateData(postsArr);
    });
};
let serviceBeetle = () => {
    database.ref('users/').remove();
    fetchWritePosts();
};
// setInterval(serviceBeetle, (1000 * 60 * 60) * 5) // Repeat every 5 hrs
serviceBeetle();

// import express from 'express';
import firebase from 'firebase/app';
import "firebase/database";
import unirest from 'unirest';
import fbCred from './galvanite/fb-cred';
import rapiCred from './galvanite/rapi-cred';
import axios from 'axios';
// TYPES 
interface IInstagramNodeData {
  node:{
    owner:{
      id: string
    }
    thumbnail_src: string,
    display_url: string,
    shortcode: string,
    edge_media_to_caption: {
      edges:[{
        node:{
          text: string
        }
      }]
    }
  }
}
interface IInstagramData {
  data:{
    hashtag:{
      edge_hashtag_to_media:{
        count: string,
        edges: [IInstagramNodeData]
      }
    }
  }
    // jsonData.data.hashtag.edgehashtagtomedia.count                                         => The count of posts
    // jsonData.data.hashtag.edgehashtagtomedia.edges                                         => The complete list of posts
    // jsonData.data.hashtag.edgehashtagtomedia.edges.node                                    => The post data root
    // jsonData.data.hashtag.edgehashtagtomedia.edges.node.thumbnailsrc                       => Post picture... maybe...
    // jsonData.data.hashtag.edgehashtagtomedia.edges.node.displayurl                         => If not, try this...
    // jsonData.data.hashtag.edgehashtagtomedia.edges.node.thumbnailresources[4].src          => If not, try this...
    // jsonData.data.hashtag.edgehashtagtomedia.edges.node.shortcode                          => redirect to post https://www.instagram.com/p/{shortcode}/
    // jsonData.data.hashtag.edgehashtagtomedia.edges.node.edgemediatocaption.edges.node.text => The caption if needed
    // jsonData.data.hashtag.edgehashtagtomedia.edges.node.owner.id                           => The User ID
}
interface IPostNodeData {
  post: {
    owner: string,
    shortcode: string,
    display_url: string,
    thumbnail_src: string,
    caption: string
  }
}
interface IPostData {
  fname: string,
  lname: string,
  instagram:{
    usr_id: string,
    posts: Array<IPostNodeData>
  }
}

firebase.initializeApp(fbCred);
let database = firebase.database();

// let usrID:string = '1419097858';
// let customHashtag:string = 'javondesigns';
let usrID:string = '369469525';
let customHashtag:string = 'galvanite';

let updateData = (postsArr:Array<IPostNodeData>) => {
  let PostData:IPostData = {
    fname: "Javon",
    lname: "Saucedo",
    instagram: {
      usr_id: usrID,
      posts: postsArr
    }
  }

  firebase.database().ref('users/' + fbCred.fbKey).set(
    PostData, 
    function(error) {
    if (error) {
      console.log(error);
    } else {
      console.log('Data saved successfully!');
    }
  }).catch(err => console.log(err));
}

let fetchWritePosts1 = () =>{
  let data:string;
  let postsArr:Array<IPostNodeData> = [];
  unirest.get(rapiCred.url)
        .query({
          "hash_tag": customHashtag
        })
        .headers({
          "x-rapidapi-key": rapiCred.xRapidApiKey,
          "x-rapidapi-host": rapiCred.xRapidApiHost,
          "useQueryString": true
        })
        .then((res:any) => {
          if (res.error) throw new Error(res.error);
          console.log(res.body)
          data = res.body;
          let jsonData:IInstagramData = JSON.parse(data);
          if (jsonData.data !== undefined){
            for(let i:number=0; i < Number(jsonData.data.hashtag.edge_hashtag_to_media.edges.length)-1; i++){
              if (jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node !== undefined){
                let postNodeData:IPostNodeData = {
                  post:{
                    owner: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.owner.id,
                    shortcode: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.shortcode,
                    display_url: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.shortcode,
                    thumbnail_src: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.display_url,
                    caption: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.edge_media_to_caption.edges[0].node.text
                  }
                }
                if(jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.owner.id == usrID){
                  console.log(`Post #${i} was added.`);
                  postsArr.push(postNodeData);
                }else{
                  console.log(`Post #${i} does not belong to user.`);
                }
              }
            }
        }else {
          console.log(`#${customHashtag} is empty.`);
        }
          updateData(postsArr);
        }).catch((err:unknown) => console.log(err))
}

let fetchWritePosts = () =>{
  let data:string;
  let postsArr:Array<IPostNodeData> = [];
  var options:any = {
    method: 'GET',
    url: `https://instagram85.p.rapidapi.com/account/${usrID}/feed`,
    params: {hash_tag: customHashtag},
    headers: {
      'x-rapidapi-key': rapiCred.xRapidApiKey,
      'x-rapidapi-host': rapiCred.xRapidApiHost
    }
  }

  axios.request(options).then(function (response) {
    let posts = response.data.data;
    for(let i:number=0; i < posts.length - 1; i++){
      console.log();
      let caption=posts[i].caption as string
      let postNodeData:IPostNodeData = {
        post:{
          owner: posts[i].owner_id,
          shortcode: posts[i].short_code,
          display_url: posts[i].post_url,
          thumbnail_src: posts[i].images.thumbnail,
          caption: caption
        }
      }
      if(caption.includes(`#${customHashtag}`)){
        // console.log(`Post ${posts[i].short_code} was added.`);
        console.log(postNodeData)
        postsArr.push(postNodeData);
      }else{
        console.log(`Post #${i} does not belong to user.`);
      }
    }
    updateData(postsArr);
  })
  .catch(function (error) {
    console.error(error);
  });
}

let serviceBeetle = () => {
  database.ref('users/'+ fbCred.fbKey).remove();
  fetchWritePosts();
}

serviceBeetle();
setInterval(serviceBeetle, (1000 * 60 * 60) * 5) // Repeat every 5 hrs
// setInterval(serviceBeetle, 30000) // Repeat every 30 seconds

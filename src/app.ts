// import express from 'express';
import firebase from 'firebase/app';
import "firebase/database";
import unirest from 'unirest';
import fbCred from './galvanite/fb-cred';
import rapiCred from './galvanite/rapi-cred';
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

let usrID:string = '1419097858';
// let usrID:string = '369469525';
// let customHashtag:string = 'galvanite';
let customHashtag:string = 'javondesigns';

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
  });
}

let fetchWritePosts = () =>{
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
  
          data = res.body;
          let jsonData:IInstagramData = JSON.parse(data);
          for(let i:number=0; i < Number(jsonData.data.hashtag.edge_hashtag_to_media.edges.length)-1; i++){
            if (jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node !== undefined){
              let postNodeData:IPostNodeData = {
                post:{
                  owner: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.owner.id,
                  shortcode: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.shortcode,
                  display_url: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.shortcode,
                  thumbnail_src: jsonData.data.hashtag.edge_hashtag_to_media.edges[i].node.thumbnail_src,
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
          updateData(postsArr);
        })
}

let serviceBeetle = () => {
  database.ref('users/').remove();
  fetchWritePosts();
}

setInterval(serviceBeetle, (1000 * 60 * 60) * 5) // Repeat every 5 hrs

// serviceBeetle();
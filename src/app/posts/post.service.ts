import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';


import { environment } from '../../environments/environment';
import { Post } from './post.model';

const BAKEND_URL =  environment.apiUrl + '/posts/';

@Injectable({providedIn: 'root'})
export class PostService {
  private posts: Post[] = [];
  private postsUpdated = new Subject<{posts: Post[], postCount: number}>();

  constructor(private http: HttpClient, private router: Router) {}

  getPosts(postPerPage: number, currentPage: number) {
    const queryParams = `?pagesize=${postPerPage}&page=${currentPage}`;
    this.http.get<{message: string, posts: any, maxPosts: number}>(BAKEND_URL + queryParams)
    .pipe(map((postData) => {
      return {
        posts: postData.posts.map(post => {
        return {
          title: post.title,
          content: post.content,
          id: post._id,
          imagePath: post.imagePath,
          creator: post.creator
        };
      }), maxPosts: postData.maxPosts};
    }))
    .subscribe((transformedPostsData) => {
      this.posts = transformedPostsData.posts;
      this.postsUpdated.next({posts: [...this.posts], postCount: transformedPostsData.maxPosts});
    });
  }

  getPost(id: string) {
    return this.http.get<{
      _id: string;
      title: string;
      content: string,
      imagePath: string,
      creator: string
    }>(BAKEND_URL + id);
  }

  getPostUpdateListner() {
    return this.postsUpdated.asObservable();
  }

  addPost(title: string, content: string, image: File) {
    // const post: Post = {id: null, title: title, content: content};
    const postData = new FormData();
    postData.append('title', title);
    postData.append('content', content);
    postData.append('image', image, title);
    this.http.post<{message: string, post: Post}>(BAKEND_URL, postData)
    .subscribe((responseData) => {
      this.router.navigate(['/']);
    });

  }

  updatePost(id: string, title: string, content: string, image: File | string) {
      let postData: Post | FormData;
    if (typeof(image) === 'object') {
      postData = new FormData();
      postData.append('id', id);
      postData.append('title', title);
      postData.append('content', content);
      postData.append('image', image, title);
    } else {
      postData = {
        id: id,
        title: title,
        content: content,
        imagePath: image,
        creator: null
      };

    }
    this.http.put(BAKEND_URL + id, postData)
    .subscribe(response => {
      this.router.navigate(['/']);
    });
  }

  deletePost(postId: string) {
   return this.http.delete(BAKEND_URL + postId);
  }
}

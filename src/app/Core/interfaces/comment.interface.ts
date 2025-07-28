export interface BugComment {
  userName: string;
  text: string;
  textDate: string;
}

export interface AddCommentRequest {
  bugid: string;
  userid: string;
  Text: string;
  textDate: string;
}

export interface AddCommentResponse {
  success: boolean;
  message: string;
  errors: any;
}

export interface GetCommentsResponse {
  data: BugComment[];
  success: boolean;
  message: string;
  errors: any;
}

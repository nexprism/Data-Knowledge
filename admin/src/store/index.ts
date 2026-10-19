import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authslice";
import courseCategoryReducer from "./slices/courseCategorySlice";
// import courseReducer from './slices/courseSlice';
import filter from "./slices/filter";
import course from "./slices/course";
import lesson from "./slices/lesson";
import module from "./slices/module";
import assignment from "./slices/assignment";
import textLesson from "./slices/textLesson";
import CourseBundle from "./slices/courseBundle";
import quiz from "./slices/quiz";
import file from "./slices/files";
import drip from "./slices/drip";
import vedio from "./slices/vedio";
import anayltics from "./slices/anayltics";
import plans from "./slices/plans";
import studentsSlice from "./slices/students";
import deleteRequestsReducer from "./slices/deleteRequests";
import Support from "./slices/support";
import certificateReducer from "./slices/certificate";
import dashboardReducer from "./slices/dashboard";
import issueCertificate from "./slices/IssuesCertification";
import salesAnalyticsReducer from "./slices/salesAnalyticsSlice";
import queryReducer from "./slices/query";
import couponsReducer from "./slices/couponsSlice";
import thread from "./slices/forumSlice"
import notification from "./slices/notification";
import deviceApprovalsReducer from "./slices/deviceApprovals";
import event from "./slices/event";
import job from "./slices/job";
import leaderboard from "./slices/leaderboard";
import banner from "./slices/banner";
import news from "./slices/news";
import securityReducer from "./slices/securitySlice";
import zoomReducer from "./slices/zoomSlice";
import resourceReducer from "./slices/resource";
import consultationReducer from "./slices/consultationSlice";
import placementStoryReducer from "./slices/placementStory";
import provenResultReducer from "./slices/provenResult";
import testimonialReducer from "./slices/testimonial";
import programOfferReducer from "./slices/programOffer";
import heroSectionReducer from "./slices/heroSection";
import whyChooseUsReducer from "./slices/whyChooseUs";
import aboutSnapshotReducer from "./slices/aboutSnapshot";
import mentorReducer from "./slices/mentor";
import adminUsersReducer from "./slices/adminUsers";
import contactReducer from "./slices/contactSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courseCategory: courseCategoryReducer,
    filter: filter,
    course: course,
    testimonial: testimonialReducer,
    lesson: lesson,
    module: module,
    assignment: assignment,
    textLesson: textLesson,
    courseBundle: CourseBundle,
    quiz: quiz,
    drip: drip,
    vedio: vedio,
    file: file,
    analytics: anayltics,
    plan: plans,
    students: studentsSlice,
    deleteRequests: deleteRequestsReducer,
    support: Support,
    dashboard: dashboardReducer,
    certificate: certificateReducer, // Assuming you have a certificate reducer
    issueCertificate: issueCertificate, // Importing issueCertificate slice
    salesAnalytics: salesAnalyticsReducer, // Importing salesAnalytics slice
    query: queryReducer, // Add this line
    coupons: couponsReducer,
    forum: thread,
    notification: notification,
    deviceApprovals: deviceApprovalsReducer,
    event: event,
    job: job,
    leaderboard: leaderboard,
    banner: banner,
    news: news,
    security: securityReducer,
    zoom: zoomReducer,
    resource: resourceReducer,
    consultation: consultationReducer,
    placementStory: placementStoryReducer,
    provenResult: provenResultReducer,
    programOffer: programOfferReducer,
    heroSection: heroSectionReducer,
    whyChooseUs: whyChooseUsReducer,
    aboutSnapshot: aboutSnapshotReducer,
    mentor: mentorReducer,
    adminUsers: adminUsersReducer,
    contact: contactReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

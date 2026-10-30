import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AddFilter from "./components/filters/AddFilter";
import FilterList from "./components/filters/FilterList";
import AddCourse from "./pages/courses/AddCourse";
import CourseList from "./pages/courses/CourseList";
import { Edit } from "lucide-react";
import EditCourse from "./pages/courses/EditCourse";
import AddBundle from "./pages/bundles/AddBundle";
import BundleList from "./pages/bundles/bundleList";
import EditBundleForm from "./pages/bundles/EditBundle";
import QuizList from "./pages/Quiz/QuizList";
import AssignmentList from "./pages/Assignmets/AssignmentList";
import TextLessonPage from "./pages/courses/TextLesson";
import EditQuiz from "./pages/courses/components/EditQuiz";
import EditAssignmentForm from "./pages/courses/components/EditAssignment";
import EditTextLessonEditor from "./pages/courses/components/EditTextLesson";
import FileList from "./pages/Files/FileList";
import AddFile from "./pages/courses/components/AddFile";
import Session from "./pages/Files/Session";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "./store/slices/authslice";
import StudentList from "./pages/students/StudenList";
import StudentDetail from "./pages/students/StudentDetail";
import AssignmentSubmissionReview from "./pages/Assignmets/AssignmentDetails";
import AssignmentSubmissions from "./pages/Assignmets/AssignmentSubmissions";
import AssignmentPage from "./pages/Assignmets/AssignmentPage";
import ErrorBoundary from "./components/common/ErrorBoundary";
import HelpDesk from "./pages/HelpDesk/RequestList";
import TicketDetails from "./pages/HelpDesk/TicketDetails";
import CertificationList from "./pages/Certification/CertificationList";
import EditCreateCertificateTemplate from "./pages/Certification/EditeCertification";
import IssueCertification from "./pages/Certification/IssueCertification";
import DeleteRequestsList from "./pages/students/DeleteRequestsList";
import User from "./pages/SalesAnalytics/User";
import Course from "./pages/SalesAnalytics/Course";
import Bundel from "./pages/SalesAnalytics/Bundel";
import Project from "./pages/Files/Project";
import QueryList from "./pages/Query/QueryList";
import Coupons from "./pages/coupons/Coupons";
import CreateCoupon from "./pages/coupons/CreateCoupon";
import EditCoupon from "./pages/coupons/EditCoupon";
import ForumThreadList from "./pages/Forum/ForumThreadList";
import AppNotificationSender from "./pages/AppNotificationSender";
import DeviceApprovals from "./pages/DeviceApprovals";
import ForumDetails from "./pages/Forum/ForumDetails";
import EditForumThread from "./pages/Forum/EditForumThread";
import AddEvent from "./pages/Events/AddEvent";
import EventList from "./pages/Events/EventList";
import EditEvent from "./pages/Events/EditEvent";
import AddJob from "./pages/Jobs/AddJob";
import JobList from "./pages/Jobs/JobList";
import EditJob from "./pages/Jobs/EditJob";
import TestimonialsPage from "./pages/Testimonials";
import Banner from "./pages/Banner/banner";
import AllBanners from "./pages/Banner/AllBanners";
import AddBanner from "./pages/Banner/AddBanner";
import EditBanner from "./pages/Banner/EditBanner";
import LeaderboardSetting from "./pages/LeaderboardSetting";
import NotificationDashboard from "./pages/Notifications/NotificationDashboard";
import NotificationList from "./pages/Notifications/NotificationList";
import NewsList from "./pages/News/NewsList";
import AddNews from "./pages/News/AddNews";
import EditNews from "./pages/News/EditNews";
import ViewNews from "./pages/News/ViewNews";
import ManageQuestions from "./pages/PersonalityTest/ManageQuestions";
import ChatPage from "./pages/Chat/ChatPage";
import AITool from "./pages/AITool/AITool";
import SecurityIncidents from "./pages/Security/Incidents";
import ZoomMeetings from "./pages/LiveClasses/ZoomMeetings";
import { AdminTrackerProvider } from "./components/AdminActivityTracker";
import ResourceList from "./pages/Resources/ResourceList";
import AddResource from "./pages/Resources/AddResource";
import EditResource from "./pages/Resources/EditResource";
import PlacementStoriesPage from "./pages/PlacementStories/PlacementStories";
import ProvenResultsPage from "./pages/ProvenResults/ProvenResults";
import ProgramsOfferPage from "./pages/ProgramsOffer/ProgramsOffer";
import HeroSectionPage from "./pages/HeroSection/HeroSection";
import WhyChooseUsPage from "./pages/WhyChooseUs/WhyChooseUs";
import AboutSnapshotPage from "./pages/AboutSnapshot/AboutSnapshot";
import MentorsPage from "./pages/Mentors";
import ContactManagement from "./pages/Contact/ContactManagement";

// Lazy load pages
const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const ChangePassword = lazy(() => import("./pages/AuthPages/ChangePassword"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsers"));

const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const Calendar = lazy(() => import("./pages/Calendar"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));
const AddCategory = lazy(() => import("./pages/AddCategory"));
const CategoryList = lazy(() => import("./pages/CategoryList"));
const AppLayout = lazy(() => import("./layout/AppLayout"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const AddReporter = lazy(() => import("./pages/Reporters/AddReporter"));
const CreateCertificateTemplate = lazy(
  () => import("./pages/Certification/CreateCertificateTemplate")
);
const ConsultationSlots = lazy(() => import("./pages/Consultations/ConsultationSlots"));
const ConsultationBookings = lazy(() => import("./pages/Consultations/ConsultationBookings"));
const TaxPaymentSettings = lazy(() => import("./pages/settings/TaxPaymentSettings"));
export default function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <Router>
      <AdminTrackerProvider>
        <ScrollToTop />
        <ErrorBoundary>
          <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
            <Routes>
            {/* Public Routes - Only accessible when NOT authenticated */}
            <Route
              path="/signin"
              element={
                !isAuthenticated ? <SignIn /> : <Navigate to="/" replace />
              }
            />

            {/* Forced first-login password change (requires a session, not the full panel) */}
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Protected Routes - Only accessible when authenticated */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index path="/" element={<Home />} />
                <Route path="/profile" element={<UserProfiles />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/add-category" element={<AddCategory />} />
                <Route path="/categories" element={<CategoryList />} />

                {/* Filters */}
                <Route path="/filters/add" element={<AddFilter />} />
                <Route path="/filters/all" element={<FilterList />} />

                <Route path="/event/add" element={<AddEvent />} />
                <Route path="/events" element={<EventList />} />
                <Route path="/events/edit/:id" element={<EditEvent />} />

                {/* Jobs */}
                <Route path="/jobs/add" element={<AddJob />} />
                <Route path="/jobs" element={<JobList />} />
                <Route path="/jobs/edit/:id" element={<EditJob />} />
                {/* Courses */}
                <Route path="/courses/add" element={<AddCourse />} />
                <Route path="/courses/all/courses" element={<CourseList />} />
                <Route path="/courses/edit/:courseId" element={<EditCourse />} />
                <Route
                  path="/courses/all/text-courses"
                  element={<TextLessonPage />}
                />
                <Route
                  path="/courses/text-courses/:lessonId"
                  element={<EditTextLessonEditor />}
                />


                <Route path="/reporters/add" element={<AddReporter />} />

                {/* Bundles */}
                <Route path="/bundles/create" element={<AddBundle />} />
                <Route path="/bundles/all" element={<BundleList />} />
                <Route path="/bundles/:bundleId" element={<EditBundleForm />} />

                {/* Quiz */}
                <Route path="/quiz/all" element={<QuizList />} />
                <Route path="/quiz/edit/:quizId" element={<EditQuiz />} />

                {/* Assignments */}
                <Route path="/assignments/all" element={<AssignmentList />} />
                <Route path="/assignments/:assignmentId" element={<AssignmentPage />} />
                <Route
                  path="/assignments/edit/:assignmentId"
                  element={<EditAssignmentForm />}
                />
                <Route
                  path="/assignments/submissions"
                  element={<AssignmentSubmissions />}
                />
                <Route
                  path="/assignments/submissions/:id"
                  element={<AssignmentSubmissionReview />}
                />

                <Route path="/forum" element={<ForumThreadList />} />
                <Route path="/forum/create" element={<EditForumThread />} />
                <Route path="/forum/:threadId" element={<ForumDetails />} />
                <Route path="/forum/edit/:threadId" element={<EditForumThread />} />

                {/* Support Tickets */}
                <Route
                  path="/support-tickets/view/:ticketId"
                  element={<TicketDetails isEditMode={false} />}
                />
                <Route
                  path="/support-tickets/edit/:ticketId"
                  element={<TicketDetails isEditMode={true} />}
                />
                <Route path="/requests" element={<HelpDesk />} />
                
                {/* Consultations */}
                <Route path="/consultations/slots" element={<ConsultationSlots />} />
                <Route path="/consultations/bookings" element={<ConsultationBookings />} />

                {/* Certificates */}
                <Route
                  path="/certificates-template/add"
                  element={<CreateCertificateTemplate />}
                />
                <Route
                  path="/certificates-template/all"
                  element={<CertificationList />}
                />
                <Route
                  path="/certificates-template/edit/:certificateId"
                  element={<EditCreateCertificateTemplate />}
                />
                <Route
                  path="/certificates/issue"
                  element={<IssueCertification />}

                />

                {/* Coupons */}
                <Route path="/coupons" element={<Navigate to="/coupons/all" replace />} />
                <Route path="/coupons/all" element={<Coupons />} />
                <Route path="/coupons/add" element={<CreateCoupon />} />
                <Route path="/coupons/edit/:couponId" element={<EditCoupon />} />

                {/* Files */}
                <Route path="/files/all" element={<FileList />} />
                <Route path="/files/add" element={<AddFile />} />
                <Route path="/files/sessions" element={<Session />} />
                <Route path="/files/projects" element={<Project />} />

                {/* Students */}
                <Route path="/students/all" element={<StudentList />} />
                <Route path="/students/:studentId" element={<StudentDetail />} />
                <Route path="/students/delete-requests" element={<DeleteRequestsList />} />

                {/* Forms */}
                <Route path="/form-elements" element={<FormElements />} />


                <Route path="/banner" element={<AllBanners />} />
                <Route path="/banner/add" element={<AddBanner />} />
                <Route path="/banner/edit/:id" element={<EditBanner />} />

                {/* Blogs / News */}
                <Route path="/news" element={<NewsList />} />
                <Route path="/news/add" element={<AddNews />} />
                <Route path="/news/view/:id" element={<ViewNews />} />
                <Route path="/news/edit/:id" element={<EditNews />} />
                <Route path="/blogs" element={<NewsList />} />
                <Route path="/blogs/add" element={<AddNews />} />
                <Route path="/blogs/view/:id" element={<ViewNews />} />
                <Route path="/blogs/edit/:id" element={<EditNews />} />

                {/* sales analytics */}
                <Route path="/sales/user" element={<User />} />
                <Route path="/sales/course" element={<Course />} />
                <Route path="/sales/bundle" element={<Bundel />} />

                {/* query */}
                <Route path="/queries/all" element={<QueryList />} />


                <Route path="/security/incidents" element={<SecurityIncidents />} />

                {/* User Profiles */}

                {/* Tables */}
                <Route path="/basic-tables" element={<BasicTables />} />


                {/* UI Elements */}
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/avatars" element={<Avatars />} />
                <Route path="/badge" element={<Badges />} />
                <Route path="/buttons" element={<Buttons />} />
                <Route path="/images" element={<Images />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/send-notification" element={<NotificationDashboard />} />
                <Route path="/notification-history" element={<NotificationList />} />
                <Route path="/device-approvals" element={<DeviceApprovals />} />
                {/* Testimonials */}
                <Route path="/testimonials" element={<TestimonialsPage />} />
                <Route path="/mentors" element={<MentorsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/ai-tool" element={<AITool />} />
                {/* Charts */}
                <Route path="/line-chart" element={<LineChart />} />
                <Route path="/bar-chart" element={<BarChart />} />
                <Route path="/leaderboard-setting" element={<LeaderboardSetting />} />
                <Route path="/personality-test" element={<ManageQuestions />} />
                <Route path="/security-incidents" element={<SecurityIncidents />} />
                <Route path="/live-classes" element={<ZoomMeetings />} />
                <Route path="/resources" element={<ResourceList />} />
                <Route path="/resources/add" element={<AddResource />} />
                <Route path="/resources/edit/:id" element={<EditResource />} />
                <Route path="/placement-stories" element={<PlacementStoriesPage />} />
                <Route path="/proven-results" element={<ProvenResultsPage />} />
                <Route path="/programs-offer" element={<ProgramsOfferPage />} />
                <Route path="/hero-section" element={<HeroSectionPage />} />
                <Route path="/why-choose-us" element={<WhyChooseUsPage />} />
                <Route path="/about-snapshot" element={<AboutSnapshotPage />} />
                <Route path="/admin-users" element={<AdminUsersPage />} />
                <Route path="/settings/tax-payment" element={<TaxPaymentSettings />} />
                <Route path="/contact-management" element={<ContactManagement />} />
                <Route path="/contact" element={<Navigate to="/contact-management" replace />} />
              </Route>
            </Route>

            {/* All unknown routes → signin */}
            <Route
              path="*"
              element={
                !isAuthenticated ? (
                  <Navigate to="/signin" replace />
                ) : (
                  <NotFound />
                )
              }
            />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AdminTrackerProvider>
    </Router>
  );
}

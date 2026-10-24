import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/common/AppLayout';
import LandingPage from '../features/landing/LandingPage';
import FileComplaintPage from '../features/complaints/FileComplaintPage';
import ComplaintWizardPage from '../features/complaints/ComplaintWizardPage';
import WrittenComplaintPage from '../features/complaints/WrittenComplaintPage';
import TrackComplaintPage from '../features/complaints/TrackComplaintPage';
import CitizenDashboardPage from '../features/dashboard/CitizenDashboardPage';
import OfficialInboxPage from '../features/official/OfficialInboxPage';
import ReviewerDashboardPage from '../features/reviewer/ReviewerDashboardPage';
import PublicRecordsPage from '../features/transparency/PublicRecordsPage';
import LegalAidPage from '../features/legal/LegalAidPage';
import LegalRemediesPage from '../features/legal/LegalRemediesPage';
import MethodologyPage from '../features/about/MethodologyPage';
import AdminDemoPage from '../features/admin/AdminDemoPage';
import SettingsPage from '../features/settings/SettingsPage';
import CommunityFeedPage from '../features/community/CommunityFeedPage';
import TimelinePage from '../features/timeline/TimelinePage';
import ProtectedRoute from '../components/common/ProtectedRoute';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* 1. Home */}
          <Route index element={<LandingPage />} />

          {/* 2. Report a Complaint (10-Step Interactive Wizard & Written Routes) */}
          <Route path="report" element={<ComplaintWizardPage />} />
          <Route path="file-complaint" element={<ComplaintWizardPage />} />
          <Route path="wizard" element={<ComplaintWizardPage />} />
          <Route path="written-complaint" element={<WrittenComplaintPage />} />
          <Route path="report/written" element={<WrittenComplaintPage />} />
          <Route path="quick-report" element={<FileComplaintPage />} />

          {/* 3. Track Complaint */}
          <Route path="track" element={<TrackComplaintPage />} />

          {/* 3B. The Accountability Timeline */}
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="timeline/:id" element={<TimelinePage />} />
          <Route path="accountability-timeline" element={<TimelinePage />} />

          {/* 4. Citizen Dashboard (Protected) */}
          <Route
            path="citizen-dashboard"
            element={
              <ProtectedRoute>
                <CitizenDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <CitizenDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 5. Office Official Inbox */}
          <Route path="official-inbox" element={<OfficialInboxPage />} />
          <Route path="official" element={<OfficialInboxPage />} />

          {/* 6. Oversight Reviewer Dashboard */}
          <Route path="reviewer-dashboard" element={<ReviewerDashboardPage />} />
          <Route path="reviewer" element={<ReviewerDashboardPage />} />

          {/* 7. Public Accountability Records */}
          <Route path="public-records" element={<PublicRecordsPage />} />
          <Route path="transparency" element={<PublicRecordsPage />} />

          {/* 8. Legal Help */}
          <Route path="legal-help" element={<LegalAidPage />} />

          {/* 9. Next Steps and Legal Remedies */}
          <Route path="legal-remedies" element={<LegalRemediesPage />} />
          <Route path="remedies" element={<LegalRemediesPage />} />

          {/* 10. Accountability Methodology */}
          <Route path="methodology" element={<MethodologyPage />} />
          <Route path="about" element={<MethodologyPage />} />

          {/* 11. Admin Demo Controls */}
          <Route path="admin-demo" element={<AdminDemoPage />} />
          <Route path="admin" element={<AdminDemoPage />} />

          {/* 12. Accessibility and Settings */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="accessibility" element={<SettingsPage />} />

          {/* Supplementary Civic Community Feed */}
          <Route path="community" element={<CommunityFeedPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

-- Multi-track learning support additions

CREATE TABLE "PlacementTest" (
    "id" UUID NOT NULL,
    "trackId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timeLimitMinutes" INTEGER NOT NULL DEFAULT 5,
    "questionCount" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementTest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "primaryTrackId" UUID,
    "learningGoals" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrackRecommendation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "trackId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlacementTest_trackId_key" ON "PlacementTest"("trackId");
CREATE UNIQUE INDEX "LearningProfile_userId_key" ON "LearningProfile"("userId");
CREATE UNIQUE INDEX "TrackRecommendation_userId_trackId_courseId_key" ON "TrackRecommendation"("userId", "trackId", "courseId");

CREATE INDEX "LearningProfile_primaryTrackId_idx" ON "LearningProfile"("primaryTrackId");
CREATE INDEX "UserTrack_userId_isPrimary_idx" ON "UserTrack"("userId", "isPrimary");
CREATE INDEX "UserTrack_trackId_level_idx" ON "UserTrack"("trackId", "level");
CREATE INDEX "TrackRecommendation_userId_trackId_idx" ON "TrackRecommendation"("userId", "trackId");

CREATE UNIQUE INDEX "UserTrack_one_primary_track_per_user_idx"
ON "UserTrack"("userId")
WHERE "isPrimary" = true;

ALTER TABLE "PlacementTest" ADD CONSTRAINT "PlacementTest_trackId_fkey"
FOREIGN KEY ("trackId") REFERENCES "LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LearningProfile" ADD CONSTRAINT "LearningProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LearningProfile" ADD CONSTRAINT "LearningProfile_primaryTrackId_fkey"
FOREIGN KEY ("primaryTrackId") REFERENCES "LearningTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TrackRecommendation" ADD CONSTRAINT "TrackRecommendation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrackRecommendation" ADD CONSTRAINT "TrackRecommendation_trackId_fkey"
FOREIGN KEY ("trackId") REFERENCES "LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrackRecommendation" ADD CONSTRAINT "TrackRecommendation_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "PlacementTest" ("id", "trackId", "title", "description", "timeLimitMinutes", "questionCount", "isActive", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    lt."id",
    lt."name" || ' Placement Test',
    'اختبار تحديد مستوى مستقل للمسار ' || lt."name",
    5,
    10,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "LearningTrack" lt
WHERE NOT EXISTS (
    SELECT 1 FROM "PlacementTest" pt WHERE pt."trackId" = lt."id"
);

INSERT INTO "LearningProfile" ("id", "userId", "primaryTrackId", "learningGoals", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    u."id",
    ut."trackId",
    '[]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User" u
LEFT JOIN "UserTrack" ut
    ON ut."userId" = u."id" AND ut."isPrimary" = true
WHERE NOT EXISTS (
    SELECT 1 FROM "LearningProfile" lp WHERE lp."userId" = u."id"
);

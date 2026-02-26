import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus, Prisma, PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AutosaveLessonDto } from './dto/autosave-lesson.dto';
import { CreateLessonRequestDto } from './dto/create-lesson-request.dto';
import { CreateModuleRequestDto } from './dto/create-module-request.dto';
import { ReorderLessonsRequestDto } from './dto/reorder-lessons-request.dto';
import { ReorderModulesRequestDto } from './dto/reorder-modules-request.dto';
import { UpdateLessonRequestDto } from './dto/update-lesson-request.dto';
import { UpdateModuleRequestDto } from './dto/update-module-request.dto';

@Injectable()
export class FrontendService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.displayName,
    };
  }

  async listTracks() {
    const courses = await this.prisma.course.findMany({
      where: { status: { in: [CourseStatus.PUBLISHED, CourseStatus.ARCHIVED] } },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => this.toTrack(course));
  }

  async getTrack(trackId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: trackId } });
    if (!course) {
      throw new NotFoundException('Track not found');
    }

    return this.toTrack(course);
  }

  async listTrackModules(trackId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: trackId },
      include: {
        currentVersion: {
          include: {
            sections: {
              include: {
                modules: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Track not found');
    }

    const modules = course.currentVersion?.sections.flatMap((s) => s.modules) || [];

    return modules
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((module) => this.toModule(module.id, trackId, module.title, module.orderIndex, module.status));
  }

  async createTrackModule(trackId: string, dto: CreateModuleRequestDto) {
    const sectionId = await this.ensureEditableSection(trackId);

    const last = await this.prisma.courseModule.findFirst({
      where: { sectionId },
      orderBy: { orderIndex: 'desc' },
    });

    const module = await this.prisma.courseModule.create({
      data: {
        sectionId,
        title: dto.title,
        description: '',
        orderIndex: dto.position ?? (last?.orderIndex ?? -1) + 1,
      },
      include: {
        section: { include: { courseVersion: true } },
      },
    });

    return this.toModule(
      module.id,
      module.section.courseVersion.courseId,
      module.title,
      module.orderIndex,
      module.status,
    );
  }

  async updateModule(moduleId: string, dto: UpdateModuleRequestDto) {
    const updated = await this.prisma.courseModule.update({
      where: { id: moduleId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.position !== undefined ? { orderIndex: dto.position } : {}),
        ...(dto.status ? { status: this.toPublishStatus(dto.status) } : {}),
      },
      include: {
        section: { include: { courseVersion: true } },
      },
    });

    return this.toModule(
      updated.id,
      updated.section.courseVersion.courseId,
      updated.title,
      updated.orderIndex,
      updated.status,
    );
  }

  async listModuleLessons(moduleId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { orderIndex: 'asc' },
    });

    return lessons.map((lesson) => this.toLesson(lesson));
  }

  async createModuleLesson(moduleId: string, dto: CreateLessonRequestDto, userId: string) {
    const last = await this.prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { orderIndex: 'desc' },
    });

    const orderIndex = dto.orderIndex ?? (last?.orderIndex ?? -1) + 1;

    const lesson = await this.prisma.lesson.create({
      data: {
        moduleId,
        title: dto.title,
        slug: dto.slug,
        markdownBody: dto.markdownBody || '',
        orderIndex,
      },
    });

    await this.prisma.lessonVersion.create({
      data: {
        lessonId: lesson.id,
        version: 1,
        markdownBody: lesson.markdownBody,
        createdBy: userId,
      },
    });

    return this.toLesson(lesson);
  }

  async getLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return this.toLesson(lesson);
  }

  async updateLesson(lessonId: string, dto: UpdateLessonRequestDto) {
    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.markdownBody !== undefined ? { markdownBody: dto.markdownBody } : {}),
        ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
        ...(dto.status ? { status: this.toPublishStatus(dto.status) } : {}),
        ...(dto.meta !== undefined
          ? { meta: dto.meta as Prisma.InputJsonValue }
          : {}),
      },
    });

    return this.toLesson(updated);
  }

  async publishLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { status: PublishStatus.PUBLISHED },
    });

    return this.toLesson(lesson);
  }

  async draftLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { status: PublishStatus.DRAFT },
    });

    return this.toLesson(lesson);
  }

  async reorderModules(dto: ReorderModulesRequestDto) {
    await this.prisma.$transaction(
      dto.moduleIds.map((moduleId, index) =>
        this.prisma.courseModule.updateMany({
          where: {
            id: moduleId,
            section: {
              courseVersion: {
                courseId: dto.trackId,
              },
            },
          },
          data: { orderIndex: index },
        }),
      ),
    );

    return { success: true };
  }

  async reorderLessons(dto: ReorderLessonsRequestDto) {
    await this.prisma.$transaction(
      dto.lessonIds.map((lessonId, index) =>
        this.prisma.lesson.updateMany({
          where: { id: lessonId, moduleId: dto.moduleId },
          data: { orderIndex: index },
        }),
      ),
    );

    return { success: true };
  }

  async autosaveLesson(lessonId: string, dto: AutosaveLessonDto, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const version = lesson.autosaveVersion + 1;

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.lesson.update({
        where: { id: lessonId },
        data: {
          markdownBody: dto.markdownBody,
          autosaveVersion: version,
        },
      });

      await tx.lessonVersion.create({
        data: {
          lessonId,
          version,
          markdownBody: dto.markdownBody,
          createdBy: userId,
        },
      });

      return saved;
    });

    return {
      version,
      updatedAt: updated.updatedAt,
    };
  }

  async listLessonVersions(lessonId: string) {
    const versions = await this.prisma.lessonVersion.findMany({
      where: { lessonId },
      orderBy: { version: 'desc' },
    });

    return versions.map((v) => ({
      id: v.id,
      lessonId: v.lessonId,
      version: v.version,
      markdownBody: v.markdownBody,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
    }));
  }

  async restoreLessonVersion(lessonId: string, versionId: string, userId: string) {
    const version = await this.prisma.lessonVersion.findFirst({
      where: { id: versionId, lessonId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const nextVersion = lesson.autosaveVersion + 1;

    await this.prisma.$transaction(async (tx) => {
      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          markdownBody: version.markdownBody,
          autosaveVersion: nextVersion,
        },
      });

      await tx.lessonVersion.create({
        data: {
          lessonId,
          version: nextVersion,
          markdownBody: version.markdownBody,
          createdBy: userId,
        },
      });
    });

    return this.getLesson(lessonId);
  }

  async progressSummary(userId: string) {
    const [lessonsTotal, lessonsCompleted, testsTotal, testsCompleted, certCount] =
      await Promise.all([
        this.prisma.lesson.count(),
        this.prisma.lessonProgress.count({ where: { userId } }),
        this.prisma.test.count(),
        this.prisma.testAttempt.findMany({
          where: { userId, passed: true },
          distinct: ['testId'],
          select: { testId: true },
        }),
        this.prisma.certificate.count({ where: { userId } }),
      ]);

    return {
      percent: lessonsTotal ? (lessonsCompleted / lessonsTotal) * 100 : 0,
      testsCompleted: testsCompleted.length,
      testsTotal,
      certificatesStatus: certCount > 0 ? 'issued' : 'not_issued',
    };
  }

  async trackProgress(userId: string, trackId: string) {
    const modules = await this.prisma.courseModule.findMany({
      where: {
        section: {
          courseVersion: {
            courseId: trackId,
          },
        },
      },
      include: { lessons: true },
      orderBy: { orderIndex: 'asc' },
    });

    const completed = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: {
          module: {
            section: {
              courseVersion: {
                courseId: trackId,
              },
            },
          },
        },
      },
      select: { lessonId: true },
    });

    const completedSet = new Set(completed.map((x) => x.lessonId));
    const lessonsTotal = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const lessonsCompleted = completedSet.size;
    const modulesCompleted = modules.filter(
      (m) => m.lessons.length > 0 && m.lessons.every((l) => completedSet.has(l.id)),
    ).length;

    return {
      trackId,
      percent: lessonsTotal ? (lessonsCompleted / lessonsTotal) * 100 : 0,
      modulesCompleted,
      modulesTotal: modules.length,
    };
  }

  async moduleProgress(userId: string, moduleId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { moduleId },
      select: { id: true },
    });

    const completed = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessons.map((l) => l.id) },
      },
      select: { lessonId: true },
    });

    const testsTotal = await this.prisma.test.count({ where: { moduleId } });
    const testsCompleted = await this.prisma.testAttempt.findMany({
      where: { userId, passed: true, test: { is: { moduleId } } },
      distinct: ['testId'],
      select: { testId: true },
    });

    return {
      moduleId,
      percent: lessons.length ? (completed.length / lessons.length) * 100 : 0,
      lessonsCompleted: completed.length,
      lessonsTotal: lessons.length,
      testsCompleted: testsCompleted.length,
      testsTotal,
    };
  }

  async completeLesson(userId: string, lessonId: string) {
    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId },
      update: { completedAt: new Date() },
    });

    return { success: true };
  }

  private async ensureEditableSection(trackId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: trackId },
      include: {
        versions: {
          select: { versionNumber: true },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
        currentVersion: {
          include: {
            sections: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Track not found');
    }

    let versionId = course.currentVersionId;

    if (!versionId) {
      const latestVersion = course.versions[0]?.versionNumber || 0;
      const version = await this.prisma.courseVersion.create({
        data: {
          courseId: trackId,
          versionNumber: latestVersion + 1,
          title: `${course.title} v${latestVersion + 1}`,
          description: course.description,
          isPublished: false,
          freePreviewEnabled: false,
        },
      });

      await this.prisma.course.update({
        where: { id: course.id },
        data: { currentVersionId: version.id },
      });

      versionId = version.id;
    }

    const section = await this.prisma.section.findFirst({
      where: { courseVersionId: versionId },
      orderBy: { orderIndex: 'asc' },
    });

    if (section) {
      return section.id;
    }

    const created = await this.prisma.section.create({
      data: {
        courseVersionId: versionId,
        title: 'Main',
        orderIndex: 0,
      },
    });

    return created.id;
  }

  private toTrack(course: { id: string; title: string; status: CourseStatus }) {
    return {
      id: course.id,
      label: course.title,
      status: course.status === CourseStatus.ARCHIVED ? 'archived' : 'active',
    };
  }

  private toModule(
    id: string,
    trackId: string,
    title: string,
    position: number,
    status: PublishStatus,
  ) {
    return {
      id,
      trackId,
      title,
      position,
      status: status === PublishStatus.PUBLISHED ? 'published' : 'draft',
    };
  }

  private toLesson(lesson: {
    id: string;
    moduleId: string;
    title: string;
    slug: string | null;
    markdownBody: string;
    status: PublishStatus;
    orderIndex: number;
    updatedAt: Date;
  }) {
    return {
      id: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      slug: lesson.slug || '',
      markdownBody: lesson.markdownBody,
      status: lesson.status === PublishStatus.PUBLISHED ? 'published' : 'draft',
      orderIndex: lesson.orderIndex,
      updatedAt: lesson.updatedAt,
    };
  }

  private toPublishStatus(status: 'draft' | 'published') {
    return status === 'published' ? PublishStatus.PUBLISHED : PublishStatus.DRAFT;
  }
}

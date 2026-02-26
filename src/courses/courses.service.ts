import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentBlock, ContentBlockType, CourseStatus } from '@prisma/client';
import { AccessService } from '../access/access.service';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentBlockDto } from './dto/create-content-block.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseVersionDto } from './dto/create-course-version.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateCourseVersionDto } from './dto/update-course-version.dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: AccessService,
    private readonly eventsService: EventsService,
  ) {}

  listPublicCourses() {
    return this.prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      include: {
        currentVersion: {
          select: {
            id: true,
            versionNumber: true,
            title: true,
            description: true,
            freePreviewEnabled: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicCourse(courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, status: CourseStatus.PUBLISHED },
      include: {
        currentVersion: {
          include: {
            sections: {
              orderBy: { orderIndex: 'asc' },
              include: {
                modules: {
                  orderBy: { orderIndex: 'asc' },
                  include: {
                    lessons: {
                      orderBy: { orderIndex: 'asc' },
                      include: {
                        contentBlocks: {
                          where: { isFree: true },
                          orderBy: { orderIndex: 'asc' },
                          select: {
                            id: true,
                            type: true,
                            title: true,
                            isFree: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async getVersionOutline(courseId: string, versionId: string) {
    const version = await this.prisma.courseVersion.findFirst({
      where: { id: versionId, courseId },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            modules: {
              orderBy: { orderIndex: 'asc' },
              include: {
                lessons: {
                  orderBy: { orderIndex: 'asc' },
                  include: {
                    contentBlocks: {
                      orderBy: { orderIndex: 'asc' },
                      select: {
                        id: true,
                        type: true,
                        title: true,
                        isFree: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return version;
  }

  async getVersionContent(courseId: string, versionId: string, userId?: string) {
    const version = await this.prisma.courseVersion.findFirst({
      where: { id: versionId, courseId },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            modules: {
              orderBy: { orderIndex: 'asc' },
              include: {
                lessons: {
                  orderBy: { orderIndex: 'asc' },
                  include: {
                    contentBlocks: {
                      orderBy: { orderIndex: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    const hasAccess = userId
      ? await this.accessService.hasCourseAccess(userId, courseId)
      : false;

    if (!hasAccess && !version.freePreviewEnabled) {
      throw new ForbiddenException('Access denied for this version');
    }

    if (hasAccess) {
      return version;
    }

    return {
      ...version,
      sections: version.sections.map((section) => ({
        ...section,
        modules: section.modules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) => ({
            ...lesson,
            contentBlocks: lesson.contentBlocks.filter((block) => block.isFree),
          })),
        })),
      })),
    };
  }

  createCourse(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        status: dto.status || CourseStatus.DRAFT,
      },
    });
  }

  updateCourse(courseId: string, dto: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { id: courseId },
      data: dto,
    });
  }

  async createCourseVersion(courseId: string, dto: CreateCourseVersionDto, createdById: string) {
    const version = await this.prisma.courseVersion.create({
      data: {
        courseId,
        versionNumber: dto.versionNumber,
        title: dto.title,
        description: dto.description,
        isPublished: dto.isPublished || false,
        freePreviewEnabled: dto.freePreviewEnabled || false,
        createdById,
      },
    });

    await this.eventsService.logEvent({
      userId: createdById,
      eventName: 'course.version.created',
      payload: { courseId, versionId: version.id, versionNumber: dto.versionNumber },
    });

    return version;
  }

  updateCourseVersion(courseId: string, versionId: string, dto: UpdateCourseVersionDto) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.courseVersion.updateMany({
        where: { id: versionId, courseId },
        data: dto,
      });

      if (!updated.count) {
        throw new NotFoundException('Version not found');
      }

      return tx.courseVersion.findUnique({ where: { id: versionId } });
    });
  }

  createSection(versionId: string, dto: CreateSectionDto) {
    return this.prisma.section.create({
      data: {
        courseVersionId: versionId,
        title: dto.title,
        orderIndex: dto.orderIndex,
      },
    });
  }

  createModule(sectionId: string, dto: CreateModuleDto) {
    return this.prisma.courseModule.create({
      data: {
        sectionId,
        title: dto.title,
        description: dto.description,
        orderIndex: dto.orderIndex,
      },
    });
  }

  createLesson(moduleId: string, dto: CreateLessonDto) {
    return this.prisma.lesson.create({
      data: {
        moduleId,
        title: dto.title,
        orderIndex: dto.orderIndex,
      },
    });
  }

  createContentBlock(lessonId: string, dto: CreateContentBlockDto): Promise<ContentBlock> {
    return this.prisma.contentBlock.create({
      data: {
        lessonId,
        type: dto.type as ContentBlockType,
        orderIndex: dto.orderIndex,
        title: dto.title,
        body: dto.body,
        isFree: dto.isFree || false,
      },
    });
  }
}
